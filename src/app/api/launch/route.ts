import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const API_KEY = process.env.LIGHTHOUSE_API_KEY;

async function parseForm(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function uploadFile(filePath: string) {
  const response = await lighthouse.upload(filePath, API_KEY!);
  return response.data.Hash;
}

async function uploadText(text: string, name: string) {
  const response = await lighthouse.uploadText(text, API_KEY!, name);
  return response.data.Hash;
}

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Lighthouse API key not set' }, { status: 500 });
  }

  try {
    // Parse form data
    const formData = await req.formData();
    // Expect: collectionImage (File), images (File[]), metadata (stringified JSON[]), collectionInfo (stringified JSON)
    const collectionImage = formData.get('collectionImage') as File;
    const images = formData.getAll('images') as File[];
    const metadataList = JSON.parse(formData.get('metadata') as string) as any[];
    const collectionInfo = JSON.parse(formData.get('collectionInfo') as string);

    // 1. Upload collection image
    const collectionImageBuffer = Buffer.from(await collectionImage.arrayBuffer());
    const collectionImagePath = `/tmp/${collectionImage.name}`;
    fs.writeFileSync(collectionImagePath, collectionImageBuffer);
    const collectionImageCid = await uploadFile(collectionImagePath);
    fs.unlinkSync(collectionImagePath);

    // 2. Upload NFT images
    const imageCids: Record<string, string> = {};
    for (const img of images) {
      const imgBuffer = Buffer.from(await img.arrayBuffer());
      const imgPath = `/tmp/${img.name}`;
      fs.writeFileSync(imgPath, imgBuffer);
      const cid = await uploadFile(imgPath);
      imageCids[img.name] = `ipfs://${cid}`;
      fs.unlinkSync(imgPath);
    }

    // 3. Update NFT metadata and upload
    const updatedMetadataCids: Record<string, string> = {};
    for (const meta of metadataList) {
      const imgFile = meta.image; // should be the filename
      meta.image = imageCids[imgFile];
      meta.collection = {
        name: collectionInfo.name,
        description: collectionInfo.description,
        image: `ipfs://${collectionImageCid}`,
      };
      const cid = await uploadText(JSON.stringify(meta), meta.name || 'nft.json');
      updatedMetadataCids[meta.name || imgFile.replace('.png', '.json')] = `ipfs://${cid}`;
    }

    // 4. Upload collection metadata
    const collectionMetadata = {
      name: collectionInfo.name,
      description: collectionInfo.description,
      image: `ipfs://${collectionImageCid}`,
      items: Object.values(updatedMetadataCids), // List of all NFT metadata CIDs
    };
    const collectionMetadataCid = await uploadText(
      JSON.stringify(collectionMetadata),
      'collection.json'
    );

    // 5. Return summary
    return NextResponse.json({
      collectionImageCid: `ipfs://${collectionImageCid}`,
      collectionMetadataCid: `ipfs://${collectionMetadataCid}`,
      imageCids,
      updatedMetadataCids,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
} 