// app/api/admin/media/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import fs from 'node:fs/promises';
import path from 'node:path';

async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return profile?.role === 'superadmin' ? user : null;
}

const BASE_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureDirectories() {
  await fs.mkdir(BASE_UPLOAD_DIR, { recursive: true });
  await fs.mkdir(path.join(BASE_UPLOAD_DIR, 'audio'), { recursive: true });
  await fs.mkdir(path.join(BASE_UPLOAD_DIR, 'encyclopedia'), { recursive: true });
}

// لیست کردن فایل‌های آرشیو رسانه
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  try {
    await ensureDirectories();

    const folders = [
      { name: 'uploads', dir: BASE_UPLOAD_DIR, urlPrefix: '/uploads' },
      { name: 'audio', dir: path.join(BASE_UPLOAD_DIR, 'audio'), urlPrefix: '/uploads/audio' },
      { name: 'encyclopedia', dir: path.join(BASE_UPLOAD_DIR, 'encyclopedia'), urlPrefix: '/uploads/encyclopedia' },
    ];

    const allFiles: any[] = [];

    for (const folder of folders) {
      try {
        const entries = await fs.readdir(folder.dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase().replace('.', '');
            const stats = await fs.stat(path.join(folder.dir, entry.name));

            let type = 'other';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
            else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) type = 'audio';

            allFiles.push({
              id: `${folder.name}_${entry.name}`,
              name: entry.name,
              url: `${folder.urlPrefix}/${entry.name}`,
              type,
              folder: folder.name,
              size: stats.size,
              created_at: stats.birthtime.toISOString(),
              updated_at: stats.mtime.toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn(`Error reading folder ${folder.name}:`, err);
      }
    }

    allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return NextResponse.json(allFiles);
  } catch (error: any) {
    console.error('Media GET error:', error);
    return NextResponse.json({ error: 'خطا در واکشی لیست رسانه‌ها' }, { status: 500 });
  }
}

// آپلود فایل جدید
export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  try {
    await ensureDirectories();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folderType = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 });
    }

    const ext = path.extname(file.name);
    const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    let targetDir = BASE_UPLOAD_DIR;
    let urlPath = `/uploads/${cleanName}`;

    if (folderType === 'audio') {
      targetDir = path.join(BASE_UPLOAD_DIR, 'audio');
      urlPath = `/uploads/audio/${cleanName}`;
    } else if (folderType === 'encyclopedia') {
      targetDir = path.join(BASE_UPLOAD_DIR, 'encyclopedia');
      urlPath = `/uploads/encyclopedia/${cleanName}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(targetDir, cleanName), buffer);

    return NextResponse.json({
      url: urlPath,
      name: cleanName,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Media POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در آپلود فایل' }, { status: 500 });
  }
}

// حذف فایل از دیسک
export async function DELETE(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');

    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'آدرس فایل نامعتبر است' }, { status: 400 });
    }

    // پیشگیری از حملات Directory Traversal
    const safeRelativePath = fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.normalize(path.join(BASE_UPLOAD_DIR, safeRelativePath));

    if (!fullPath.startsWith(BASE_UPLOAD_DIR)) {
      return NextResponse.json({ error: 'مسیر غیرمجاز' }, { status: 403 });
    }

    await fs.unlink(fullPath);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Media DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف فایل یا فایل یافت نشد' }, { status: 500 });
  }
}