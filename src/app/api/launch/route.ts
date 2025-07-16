import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

const API_KEY = process.env.LIGHTHOUSE_API_KEY;

// Helper to save uploaded files to a temp dir, preserving relative paths but stripping leading folder prefix
async function saveUploadedDirFromFormData(files: File[], tempDir: string) {
  for (const file of files) {
    // Use webkitRelativePath or fallback to file.name
    let relPath = (file as any).webkitRelativePath || file.name;
    // Remove any leading folder prefix (e.g., 'metadata/', 'images/')
    relPath = relPath.replace(/^.*metadata[\\/]/i, '').replace(/^.*images[\\/]/i, '');
    const filePath = path.join(tempDir, relPath);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
  }
}

// Helper to sanitize collection name for folder naming
function sanitizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Lighthouse API key not set' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const uploadType = formData.get('uploadType');
    const collectionInfo = formData.get('collectionInfo') ? JSON.parse(formData.get('collectionInfo') as string) : null;
    const sanitizedCollectionName = collectionInfo?.name ? sanitizeName(collectionInfo.name) : 'collection';

    if (uploadType === 'images') {
      // Handle images folder upload
      const images = formData.getAll('images') as File[];
      const imagesTempDir = path.join(os.tmpdir(), `${sanitizedCollectionName}-images`);
      fs.mkdirSync(imagesTempDir, { recursive: true });
      await saveUploadedDirFromFormData(images, imagesTempDir);
      const imagesFolderRes = await lighthouse.upload(imagesTempDir, API_KEY!);
      const imagesFolderCID = imagesFolderRes.data.Hash;
      fs.rmSync(imagesTempDir, { recursive: true, force: true });
      return NextResponse.json({ imagesFolderCID: `ipfs://${imagesFolderCID}` });
    } else if (uploadType === 'metadata') {
      // Handle metadata folder upload and update
      const metadataFiles = formData.getAll('metadata') as File[];
      const collectionImage = formData.get('collectionImage') as File | null;
      const imagesFolderCID = (formData.get('imagesFolderCID') as string || '').replace('ipfs://', '');

      const metadataTempDir = path.join(os.tmpdir(), `${sanitizedCollectionName}-metadata`);
      fs.mkdirSync(metadataTempDir, { recursive: true });
      await saveUploadedDirFromFormData(metadataFiles, metadataTempDir);

      // Update each .json file's image field to use the gateway URL
      if (imagesFolderCID) {
        const files = fs.readdirSync(metadataTempDir);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const metaPath = path.join(metadataTempDir, file);
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          const num = file.replace('.json', '');
          meta.image = `https://gateway.lighthouse.storage/ipfs/${imagesFolderCID}/${num}.png`;
          fs.writeFileSync(metaPath, JSON.stringify(meta));
        }
      }

      // Optionally upload collection image
      let collectionImageCid = '';
      if (collectionImage) {
        const collectionImageBuffer = Buffer.from(await collectionImage.arrayBuffer());
        const collectionImagePath = path.join(os.tmpdir(), collectionImage.name);
        fs.writeFileSync(collectionImagePath, collectionImageBuffer);
        const imgRes = await lighthouse.upload(collectionImagePath, API_KEY!);
        collectionImageCid = imgRes.data.Hash;
        fs.unlinkSync(collectionImagePath);
      }

      // Upload updated metadata folder to IPFS
      const metadataFolderRes = await lighthouse.upload(metadataTempDir, API_KEY!);
      const metadataFolderCID = metadataFolderRes.data.Hash;
      fs.rmSync(metadataTempDir, { recursive: true, force: true });
      return NextResponse.json({
        metadataFolderCID: `ipfs://${metadataFolderCID}`,
        collectionImageCid: collectionImageCid ? `ipfs://${collectionImageCid}` : '',
      });
    } else if (uploadType === 'collection-metadata') {
      // Handle collection-level metadata JSON upload
      const collectionMetadataFile = formData.get('collectionMetadata') as File;
      if (!collectionMetadataFile) {
        return NextResponse.json({ error: 'No collection metadata file provided' }, { status: 400 });
      }
      // Save to temp file
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, collectionMetadataFile.name);
      const buffer = Buffer.from(await collectionMetadataFile.arrayBuffer());
      fs.writeFileSync(tempPath, buffer);
      // Upload to Lighthouse
      const res = await lighthouse.upload(tempPath, API_KEY!);
      const collectionMetadataCid = res.data.Hash;
      fs.unlinkSync(tempPath);
      return NextResponse.json({ collectionMetadataCid: `ipfs://${collectionMetadataCid}` });
    } else {
      return NextResponse.json({ error: 'Invalid uploadType' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
} 