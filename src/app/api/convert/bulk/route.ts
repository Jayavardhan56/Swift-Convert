import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { convertDocxToPdf, convertPdfToDocx } from '@/lib/server-converter';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

// In-memory job store
const jobs: Record<string, {
  status: 'processing' | 'completed' | 'error';
  progress: number;
  results: string[];
  zipPath?: string;
  error?: string;
}> = {};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    if (files.length > 200) return NextResponse.json({ error: 'Max 200 files allowed' }, { status: 400 });

    const jobId = uuidv4();
    const jobDir = path.join(process.cwd(), 'temp', jobId);
    const inputDir = path.join(jobDir, 'input');
    const outputDir = path.join(jobDir, 'output');

    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    jobs[jobId] = { status: 'processing', progress: 0, results: [] };

    processJob(jobId, files, inputDir, outputDir);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function processJob(jobId: string, files: File[], inputDir: string, outputDir: string) {
  try {
    const results: string[] = [];
    let processed = 0;

    for (const file of files) {
      const inputPath = path.join(inputDir, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(inputPath, buffer);

      const ext = path.extname(file.name).toLowerCase();
      let outputPath = '';

      try {
        if (ext === '.pdf') {
          const docxName = file.name.replace(/\.pdf$/i, '.docx');
          outputPath = path.join(outputDir, docxName);
          await convertPdfToDocx(inputPath, outputPath);
        } else if (ext === '.docx') {
          outputPath = await convertDocxToPdf(inputPath, outputDir);
        }
        results.push(path.basename(outputPath));
      } catch (err) {
        console.error(`Error converting ${file.name}:`, err);
      }

      processed++;
      jobs[jobId].progress = Math.round((processed / files.length) * 100);
      jobs[jobId].results = [...results]; // Update results in real-time
    }

    const zipName = 'SwiftConvert_Results.zip';
    const zipPath = path.join(outputDir, zipName);
    await createZip(outputDir, results, zipPath);

    jobs[jobId].status = 'completed';
    jobs[jobId].zipPath = zipPath;

    // Auto-cleanup: Delete job directory after 1 hour to save disk space
    setTimeout(async () => {
      try {
        const jobDir = path.join(process.cwd(), 'temp', jobId);
        await fs.rm(jobDir, { recursive: true, force: true });
        delete jobs[jobId];
        console.log(`Cleaned up job: ${jobId}`);
      } catch (e) {
        console.error(`Cleanup failed for ${jobId}:`, e);
      }
    }, 60 * 60 * 1000); 
  } catch (error: any) {
    jobs[jobId].status = 'error';
    jobs[jobId].error = error.message;
  }
}

function createZip(sourceDir: string, files: string[], outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    files.forEach(file => {
      archive.file(path.join(sourceDir, file), { name: file });
    });
    archive.finalize();
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const download = searchParams.get('download');
  const fileName = searchParams.get('file');

  if (!id || !jobs[id]) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const job = jobs[id];
  const jobDir = path.join(process.cwd(), 'temp', id);

  if (download === 'true') {
    if (fileName) {
      const filePath = path.join(jobDir, 'output', fileName);
      if (!existsSync(filePath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (job.status !== 'completed' || !job.zipPath) {
      return NextResponse.json({ error: 'Files not ready' }, { status: 400 });
    }
    const fileBuffer = await fs.readFile(job.zipPath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SwiftConvert_Results.zip"`,
      },
    });
  }

  return NextResponse.json(job);
}
