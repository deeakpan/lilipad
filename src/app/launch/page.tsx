'use client';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { FaWallet } from 'react-icons/fa';
import { FaUpload } from 'react-icons/fa';
// If you haven't already, run: npm install jszip
import JSZip from 'jszip';
import { ConnectButton as ConnectButtonBase } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

function validateUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateTwitter(twitter: string) {
  // Accepts @handle or full URL
  if (!twitter) return false;
  if (twitter.startsWith('@')) return twitter.length > 1;
  if (/^https?:\/\/(www\.)?twitter\.com\/[A-Za-z0-9_]{1,15}$/.test(twitter)) return true;
  return false;
}

function validateVanity(vanity: string) {
  // Only allow lowercase letters, numbers, and hyphens, at least 4 chars
  return /^[a-z0-9-]{4,}$/.test(vanity);
}

export default function LaunchPage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    vanity: '',
    description: '',
    royalty: '',
    website: '',
    twitter: '',
    banner: null as File | null,
  });
  const [metaFile, setMetaFile] = useState<File | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  // Only one upload: metadata file (.json or .zip)
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [nftPreviews, setNftPreviews] = useState<Array<{ imageUrl: string; metadata: any }> | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setForm(f => ({ ...f, [name]: file }));
    } else {
      if (name === 'royalty') {
        // Only allow numbers and up to one dot
        let v = value.replace(/[^\d.]/g, '');
        // Only one dot
        v = v.replace(/(\..*)\./g, '$1');
        // No leading zeros unless "0." pattern
        if (v.length > 1 && v[0] === '0' && v[1] !== '.') v = v.replace(/^0+/, '');
        // Prevent more than two decimals
        if (v.includes('.')) v = v.replace(/(\.\d{2}).+/, '$1');
        // Enforce max 50
        if (v && Number(v) > 50) v = '50';
        setForm(f => ({ ...f, [name]: v }));
      } else if (name === 'vanity') {
        // Only allow lowercase letters, numbers, hyphens
        let v = value.replace(/[^a-z0-9-]/g, '');
        // No two hyphens in a row
        v = v.replace(/--+/g, '-');
        // No more than 3 hyphens total
        const hyphens = (v.match(/-/g) || []).length;
        if (hyphens > 3) {
          // Remove extra hyphens from the end
          let count = 0;
          v = v.split('').filter(char => {
            if (char === '-') {
              count++;
              return count <= 3;
            }
            return true;
          }).join('');
        }
        setForm(f => ({ ...f, [name]: v }));
      } else {
        setForm(f => ({ ...f, [name]: value }));
      }
    }
    // Live validation
    setErrors(errs => {
      const newErrs = { ...errs };
      if (name === 'royalty') {
        if (!value.trim()) newErrs.royalty = 'Royalty is required.';
        else if (!/^(\d{1,2}(\.\d{1,2})?|50(\.0{1,2})?)$/.test(value.trim()) || Number(value) < 0 || Number(value) > 50) newErrs.royalty = 'Royalty must be a number between 0 and 50.';
        else delete newErrs.royalty;
      }
      if (name === 'vanity') {
        if (!value.trim()) newErrs.vanity = 'Vanity URL is required.';
        else if (!validateVanity(value.trim())) newErrs.vanity = 'Vanity URL must be at least 4 characters and only contain lowercase letters, numbers, and hyphens.';
        else delete newErrs.vanity;
      }
      return newErrs;
    });
  };

  const validateStep1 = () => {
    const errs: { [k: string]: string } = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.vanity.trim()) errs.vanity = 'Vanity URL is required.';
    else if (!validateVanity(form.vanity.trim())) errs.vanity = 'Vanity URL must be at least 4 characters and only contain lowercase letters, numbers, and hyphens.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.royalty.trim()) errs.royalty = 'Royalty is required.';
    else if (!/^(\d{1,2}(\.\d{1,2})?|50(\.0{1,2})?)$/.test(form.royalty.trim()) || Number(form.royalty) < 0 || Number(form.royalty) > 50) errs.royalty = 'Royalty must be a number between 0 and 50.';
    if (!form.banner) errs.banner = 'Banner is required.';
    if (!form.website.trim()) errs.website = 'Website is required.';
    else if (!validateUrl(form.website.trim())) errs.website = 'Enter a valid website URL.';
    if (!form.twitter.trim()) errs.twitter = 'Twitter is required.';
    else if (!validateTwitter(form.twitter.trim())) errs.twitter = 'Enter a valid Twitter handle or URL.';
    return errs;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep1();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setStep(2);
    }
  };

  const handleMetaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMetaFile(file);
    setShowPreview(false);
    setTotalSupply(null);
    setZipError(null);
    setNftPreviews(null);
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setZipError('Only .zip files are allowed.');
        return;
      }
      setZipLoading(true);
      try {
        const jszip = new JSZip();
        const zip = await jszip.loadAsync(file);
        // Collect .json and image files
        const jsonFiles: { name: string; file: JSZip.JSZipObject }[] = [];
        const imageFiles: { name: string; file: JSZip.JSZipObject }[] = [];
        zip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
          if (zipEntry.name.endsWith('.json')) jsonFiles.push({ name: zipEntry.name, file: zipEntry });
          if (zipEntry.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) imageFiles.push({ name: zipEntry.name, file: zipEntry });
        });
        setTotalSupply(jsonFiles.length);
        // Sort both arrays alphabetically for matching
        jsonFiles.sort((a, b) => a.name.localeCompare(b.name));
        imageFiles.sort((a, b) => a.name.localeCompare(b.name));
        // Match by order
        const previews: Array<{ imageUrl: string; metadata: any }> = [];
        for (let i = 0; i < Math.min(jsonFiles.length, imageFiles.length, 8); i++) { // show up to 8 previews
          const metaStr = await jsonFiles[i].file.async('string');
          let metadata: any = {};
          try { metadata = JSON.parse(metaStr); } catch {}
          const imgBlob = await imageFiles[i].file.async('blob');
          const imageUrl = URL.createObjectURL(imgBlob);
          previews.push({ imageUrl, metadata });
        }
        setNftPreviews(previews);
      } catch (err) {
        setZipError('Failed to parse zip file.');
      }
      setZipLoading(false);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaFile) return;
    setSubmitting(true);
    // TODO: Implement upload logic
    setTimeout(() => {
      alert('Collection uploaded!');
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#000', color: '#32CD32', borderColor: '#32CD32' }}>
      {/* Minimal Header */}
      <div className="w-full p-4 shadow-lg z-40 border-b-2 flex items-center justify-between" style={{ backgroundColor: '#000', borderColor: '#32CD32' }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/lily-removebg-preview.png" 
            alt="LiliPad Logo" 
            className="rounded-full object-cover w-9 h-9"
          />
          <h1 className="text-lg font-bold tracking-wide text-yellow-300">LiliPad</h1>
        </Link>
        <ConnectButtonBase.Custom>
          {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }: any) => (
            <button
              onClick={
                !mounted
                  ? undefined
                  : !account || !chain
                  ? openConnectModal
                  : openAccountModal
              }
              type="button"
              className="flex items-center gap-2 px-3 py-1 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-sm"
            >
              <FaWallet className="w-5 h-5" />
              <span className="font-semibold text-sm">{account ? 'connected' : 'connect'}</span>
            </button>
          )}
        </ConnectButtonBase.Custom>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 w-full">
        {!isConnected ? (
          <h1 className="text-2xl font-bold mb-4 text-[#32CD32] text-center w-full">Connect your wallet to access this page</h1>
        ) : step === 1 ? (
          <form
            className="w-full max-w-2xl mx-auto bg-black p-0 sm:p-8 flex flex-col gap-8"
            onSubmit={handleStep1Submit}
            noValidate
          >
            <h2 className="text-4xl font-extrabold mb-4 text-[#32CD32]">Collection Info</h2>
            <p className="text-green-200 text-base mb-2">Fill in all fields to continue.</p>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Name</label>
              <input name="name" type="text" className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg" placeholder="Collection name" value={form.name} onChange={handleChange} />
              {errors.name && <span className="text-red-400 text-sm mt-1">{errors.name}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Vanity URL</label>
              <input name="vanity" type="text" className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg" placeholder="your-collection-url" value={form.vanity} onChange={handleChange} />
              {errors.vanity && <span className="text-red-400 text-sm mt-1">{errors.vanity}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Description</label>
              <textarea name="description" className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg" placeholder="Describe your collection" rows={4} value={form.description} onChange={handleChange} />
              {errors.description && <span className="text-red-400 text-sm mt-1">{errors.description}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Creator Royalty (max 50%)</label>
              <input
                name="royalty"
                type="number"
                min="0"
                max="50"
                step="0.01"
                className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg"
                placeholder="e.g. 5"
                value={form.royalty}
                onChange={handleChange}
              />
              {errors.royalty && <span className="text-red-400 text-sm mt-1">{errors.royalty}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Banner</label>
              <input name="banner" type="file" accept="image/*" className="w-full text-white text-lg" onChange={handleChange} />
              {errors.banner && <span className="text-red-400 text-sm mt-1">{errors.banner}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Website</label>
              <input name="website" type="url" className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg" placeholder="https://yourwebsite.com" value={form.website} onChange={handleChange} />
              {errors.website && <span className="text-red-400 text-sm mt-1">{errors.website}</span>}
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">Twitter</label>
              <input name="twitter" type="text" className="w-full px-6 py-4 rounded-xl border-2 border-[#32CD32] bg-black text-white focus:outline-none focus:border-yellow-300 text-lg" placeholder="@yourtwitter or https://twitter.com/yourhandle" value={form.twitter} onChange={handleChange} />
              {errors.twitter && <span className="text-red-400 text-sm mt-1">{errors.twitter}</span>}
            </div>
            <button type="submit" className="mt-8 px-10 py-4 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-2xl self-center disabled:opacity-50" disabled={submitting}>Next</button>
            <p className="text-green-200 text-base mb-2 text-center">You don’t have a collection? Start by generating and exporting your collection metadata <a href="https://lilipad-nft-export.vercel.app" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-400">here</a></p>
          </form>
        ) : showPreview && nftPreviews && nftPreviews.length > 0 ? (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 bg-black p-8 rounded-2xl border-2 border-[#32CD32]">
            <div className="w-full flex flex-row items-center mb-6">
              <button
                type="button"
                className="mr-2 text-[#32CD32] hover:text-green-400 focus:outline-none"
                style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, fontSize: '1.7rem', lineHeight: 1 }}
                onClick={() => setShowPreview(false)}
                aria-label="Back"
              >
                &#8592;
              </button>
              <h4 className="text-xl font-semibold text-white ml-1">NFT Preview <span className="text-green-400 font-normal">({nftPreviews.length})</span></h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {nftPreviews.map((nft, idx) => (
                <div key={idx} className="flex flex-col items-center bg-[#222] rounded-xl p-4 border border-[#32CD32]">
                  <img src={nft.imageUrl} alt="NFT preview" className="w-32 h-32 object-contain rounded mb-2 border border-yellow-300" />
                  <pre className="text-xs text-green-200 bg-[#181818] rounded p-2 w-full overflow-x-auto max-h-32">{JSON.stringify(nft.metadata, null, 2)}</pre>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-8 px-7 py-2 bg-[#32CD32] text-black rounded-md font-medium hover:bg-green-500 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-50"
              disabled={!metaFile || zipLoading || !Array.isArray(nftPreviews) || nftPreviews.length === 0}
              onClick={() => {
                if (!metaFile || zipLoading || !Array.isArray(nftPreviews) || nftPreviews.length === 0) {
                  setZipError('Upload a valid collection.');
                  return;
                }
                // If valid, proceed to next step (implement as needed)
              }}
            >
              Launch
            </button>
          </div>
        ) : (
          <form
            className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 bg-black p-8 rounded-2xl border-2 border-[#32CD32]"
            onSubmit={e => { e.preventDefault(); /* Next step logic here */ }}
          >
            <div className="w-full flex flex-row items-center mb-4">
              <button
                type="button"
                className="mr-2 text-[#32CD32] hover:text-green-400 focus:outline-none"
                style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, fontSize: '1.7rem', lineHeight: 1 }}
                onClick={() => setStep(1)}
                aria-label="Back"
                disabled={submitting}
              >
                &#8592;
              </button>
              <h2 className="text-3xl font-extrabold text-[#32CD32] ml-1">Upload Collection Metadata</h2>
            </div>
            <div
              className="w-full flex flex-col items-center justify-center gap-4 border-4 border-dashed rounded-2xl p-10 bg-[#111] hover:bg-[#181818] transition-colors relative cursor-pointer"
              style={{ borderColor: '#32CD32', minHeight: 220 }}
              onClick={e => {
                // Only trigger file picker if the click is directly on the dashed area, not on its children
                if (e.target === e.currentTarget && !zipLoading) {
                  document.getElementById('meta-upload-input')?.click();
                }
              }}
              tabIndex={0}
              role="button"
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && !zipLoading) {
                  document.getElementById('meta-upload-input')?.click();
                }
              }}
            >
              <FaUpload className="w-16 h-16 text-yellow-400 mb-2" />
              <label className="text-green-200 mb-1 text-lg font-semibold">Select your collection .zip file</label>
              <input
                id="meta-upload-input"
                type="file"
                accept=".zip,application/zip"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 2 }}
                onChange={handleMetaFile}
                tabIndex={-1}
                aria-label="Upload collection zip file"
              />
              {metaFile && <span className="text-xs text-green-300 mt-1">{metaFile.name}</span>}
              {zipLoading && <span className="text-yellow-300 mt-2">Parsing zip...</span>}
              {zipError && <span className="text-red-400 mt-2">{zipError}</span>}
              {totalSupply !== null && !zipLoading && !zipError && (
                <span className="text-green-300 mt-2 text-lg font-bold">Total Supply: {totalSupply}</span>
              )}
            </div>
            {/* Preview button is now outside the upload area */}
            {metaFile && !zipLoading && !zipError && (totalSupply ?? 0) > 0 && !showPreview && (
              <button
                type="button"
                className="mt-4 px-8 py-3 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-lg"
                onClick={async () => {
                  setShowPreview(true);
                  if (!nftPreviews) {
                    setZipLoading(true);
                    setZipError(null);
                    try {
                      const jszip = new JSZip();
                      const zip = await jszip.loadAsync(metaFile);
                      const jsonFiles: { name: string; file: JSZip.JSZipObject }[] = [];
                      const imageFiles: { name: string; file: JSZip.JSZipObject }[] = [];
                      zip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
                        if (zipEntry.name.endsWith('.json')) jsonFiles.push({ name: zipEntry.name, file: zipEntry });
                        if (zipEntry.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) imageFiles.push({ name: zipEntry.name, file: zipEntry });
                      });
                      jsonFiles.sort((a, b) => a.name.localeCompare(b.name));
                      imageFiles.sort((a, b) => a.name.localeCompare(b.name));
                      const previews: Array<{ imageUrl: string; metadata: any }> = [];
                      for (let i = 0; i < Math.min(jsonFiles.length, imageFiles.length, 8); i++) {
                        try {
                          const metaStr = await jsonFiles[i].file.async('string');
                          let metadata: any = {};
                          try { metadata = JSON.parse(metaStr); } catch { throw new Error('Invalid metadata JSON'); }
                          const imgBlob = await imageFiles[i].file.async('blob');
                          const imageUrl = URL.createObjectURL(imgBlob);
                          previews.push({ imageUrl, metadata });
                        } catch (err) {
                          // skip this pair if error
                          continue;
                        }
                      }
                      if (previews.length === 0) {
                        setZipError('No valid NFTs found in zip. Please check your files.');
                        setShowPreview(false);
                        setNftPreviews(null);
                        setZipLoading(false);
                        return;
                      }
                      setNftPreviews(previews);
                    } catch (err) {
                      setZipError('Failed to parse zip file. Please ensure it contains valid metadata and image files.');
                      setShowPreview(false);
                      setNftPreviews(null);
                    }
                    setZipLoading(false);
                  }
                }}
              >
                Preview
              </button>
            )}
            {zipError && (
              <div className="mt-4 text-red-400 text-center font-bold">{zipError}</div>
            )}
            {/* Preview of entered details */}
            <div className="w-full bg-[#181818] rounded-xl p-6 mt-4 border border-[#32CD32]">
              <h3 className="text-xl font-bold text-yellow-300 mb-2">Collection Preview</h3>
              <div className="text-white text-base mb-1"><span className="font-semibold">Name:</span> {form.name}</div>
              <div className="text-white text-base mb-1"><span className="font-semibold">Vanity URL:</span> {form.vanity}</div>
              <div className="text-white text-base mb-1"><span className="font-semibold">Description:</span> {form.description}</div>
              <div className="text-white text-base mb-1"><span className="font-semibold">Royalty:</span> {form.royalty}%</div>
              <div className="text-white text-base mb-1"><span className="font-semibold">Website:</span> {form.website}</div>
              <div className="text-white text-base mb-1"><span className="font-semibold">Twitter:</span> {form.twitter}</div>
              {totalSupply !== null && !zipLoading && !zipError && (
                <div className="text-green-300 text-base mt-2"><span className="font-semibold">Total Supply:</span> {totalSupply}</div>
              )}
            </div>
            <div className="w-full flex flex-row justify-end mt-8">
              <button
                type="button"
                className="px-7 py-2 bg-[#32CD32] text-black rounded-md font-medium hover:bg-green-500 transition-colors text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 disabled:opacity-50"
                disabled={!metaFile || zipLoading || !Array.isArray(nftPreviews) || nftPreviews.length === 0}
                onClick={async () => {
                  if (!metaFile || zipLoading || !Array.isArray(nftPreviews) || nftPreviews.length === 0) {
                    setZipError('Upload a valid collection.');
                    return;
                  }
                  // Fetch token amount worth $10 USD and log to terminal
                  try {
                    const res = await fetch('/api/token-usd');
                    const data = await res.json();
                    if (data && data.amount && data.price) {
                      // eslint-disable-next-line no-console
                      console.log(`$10 USD = ${data.amount} tokens (1 token = $${data.price})`);
                    } else {
                      // eslint-disable-next-line no-console
                      console.log('Could not fetch token price.');
                    }
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.log('Error fetching token price:', err);
                  }
                  // If valid, proceed to next step (implement as needed)
                }}
              >
                Launch
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 