'use client';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { FaWallet, FaArrowUp, FaLayerGroup, FaThLarge, FaCloudUploadAlt } from "react-icons/fa";
import { ConnectButton as ConnectButtonBase } from "@rainbow-me/rainbowkit";
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import Switch from 'react-switch';

interface LaunchResult {
  error?: string;
  collectionImageCid?: string;
  collectionMetadataCid?: string;
  imageCids?: Record<string, string>;
  updatedMetadataCids?: Record<string, string>;
}

export default function CreatePage() {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [extractedPairs, setExtractedPairs] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const { isConnected } = useAccount();
  useEffect(() => { setMounted(true); }, []);

  // Form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [vanityUrl, setVanityUrl] = useState('');
  const [vanityUrlError, setVanityUrlError] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [royalty, setRoyalty] = useState('');
  const [samePrice, setSamePrice] = useState(true);
  const [allPrice, setAllPrice] = useState('');
  const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});

  // Vanity URL validation
  function validateVanityUrl(value: string) {
    if (value.length <= 4) return 'Must be more than 4 characters';
    if (/^[\-]/.test(value)) return 'Cannot start with a dash';
    if (/--/.test(value)) return 'Cannot have two dashes in a row';
    if ((value.match(/-/g) || []).length > 3) return 'No more than 3 dashes allowed';
    if (/[",'_\.:]/.test(value)) return 'No commas, quotes, underscores, colons, or periods allowed';
    return '';
  }

  function handleVanityUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    // Remove invalid characters immediately
    value = value.replace(/[^a-zA-Z0-9-]/g, ''); // Only allow letters, numbers, dashes
    // Remove spaces
    value = value.replace(/\s+/g, '');
    setVanityUrl(value);
    setVanityUrlError(validateVanityUrl(value));
  }

  // Banner upload logic
  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    } else {
      setBannerFile(null);
      setBannerPreview(null);
    }
  }

  // Royalty input handler to prevent >50
  function handleRoyaltyChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value;
    if (Number(value) > 50) value = '50';
    setRoyalty(value);
  }

  async function handleExtractZip() {
    if (!zipFile) return;
    setIsExtracting(true);
    setExtractError('');
    try {
      const zip = await JSZip.loadAsync(zipFile);
      // Collect all files
      const files = Object.values(zip.files);
      // Find images and jsons
      const imageFiles = files.filter(f => /(png|jpg|jpeg|gif)$/i.test(f.name));
      const jsonFiles = files.filter(f => /\.json$/i.test(f.name));
      // Map by number (e.g., 0.png, 0.json)
      const imageMap = new Map();
      for (const img of imageFiles) {
        const match = img.name.match(/(\d+)\.(png|jpg|jpeg|gif)$/i);
        if (match) imageMap.set(match[1], img);
      }
      const jsonMap = new Map();
      for (const js of jsonFiles) {
        const match = js.name.match(/(\d+)\.json$/i);
        if (match) jsonMap.set(match[1], js);
      }
      // Pair them
      const pairs = [];
      for (const [num, imgFile] of imageMap.entries()) {
        if (jsonMap.has(num)) {
          const jsonFile = jsonMap.get(num);
          // Get image blob and preview URL
          const imgBlob = await imgFile.async('blob');
          const imgUrl = URL.createObjectURL(imgBlob);
          // Get metadata
          const jsonText = await jsonFile.async('string');
          let metadata;
          try { metadata = JSON.parse(jsonText); } catch { metadata = {}; }
          // Create a File object for the image (for FormData)
          const ext = imgFile.name.split('.').pop() || 'png';
          const fileName = `${num}.${ext}`;
          const file = new File([imgBlob], fileName, { type: imgBlob.type });
          pairs.push({ num, imgUrl, imgFile: file, metadata });
        }
      }
      setExtractedPairs(pairs);
    } catch (e) {
      setExtractError('Failed to extract or parse ZIP.');
    }
    setIsExtracting(false);
  }

  // Validation for Next button
  const isFormValid =
    collectionName.trim().length > 0 &&
    collectionDesc.trim().length > 0 &&
    vanityUrlError === '' &&
    vanityUrl.trim().length > 0 &&
    username.trim().length > 0 &&
    (!website || /^https:\/\/.+\..+/.test(website)) &&
    royalty !== '' && Number(royalty) <= 50;

  // State for final summary section
  const [showFinalSummary, setShowFinalSummary] = useState(false);

  // Add state for start/end date and time
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // Helper to combine date and time into ISO string
  function combineDateTime(date: string, time: string) {
    if (!date || !time) return "";
    return new Date(`${date}T${time}:00Z`).toISOString();
  }
  const mintStartISO = combineDateTime(startDate, startTime);
  const mintEndISO = combineDateTime(endDate, endTime);

  const isDatesValid = !!mintStartISO && !!mintEndISO && new Date(mintStartISO) < new Date(mintEndISO);

  // Helper for price validation
  const isMintPriceValid = samePrice
    ? !!allPrice && !isNaN(Number(allPrice)) && Number(allPrice) > 0
    : extractedPairs.length > 0 && Object.keys(individualPrices).length === extractedPairs.length && Object.values(individualPrices).every(p => !!p && !isNaN(Number(p)) && Number(p) > 0);

  // Add state for live countdown
  const [countdown, setCountdown] = useState("");
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Live countdown effect for summary
  useEffect(() => {
    if (!showFinalSummary) return;
    function updateCountdown() {
      const now = new Date();
      const start = mintStartISO ? new Date(mintStartISO) : null;
      if (start && now < start) {
        const diff = start.getTime() - now.getTime();
        const days = Math.floor(diff / 1000 / 60 / 60 / 24);
        const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        let str = '';
        if (days > 0) str += `${days}d `;
        str += `${hours}h ${mins}m`;
        setCountdown(str);
      } else {
        setCountdown("");
      }
    }
    updateCountdown();
    countdownInterval.current = setInterval(updateCountdown, 1000);
    return () => { if (countdownInterval.current) clearInterval(countdownInterval.current); };
  }, [showFinalSummary, mintStartISO]);

  // Validation for date/time pickers
  const nowISODate = new Date().toISOString().slice(0, 10);
  const nowISOTime = new Date().toISOString().slice(11, 16);
  const startDateError = startDate && (startDate < nowISODate) ? "Start date cannot be in the past" : "";
  const startTimeError = startDate === nowISODate && startTime && (startTime < nowISOTime) ? "Start time cannot be in the past" : "";
  const endDateError = endDate && (endDate < startDate) ? "End date cannot be before start date" : "";
  const endTimeError = endDate === startDate && endTime && (endTime <= startTime) ? "End time must be after start time" : "";
  const isDateTimeValid = !startDateError && !startTimeError && !endDateError && !endTimeError && isDatesValid;

  // Add state for showing the fees modal
  const [showFeesModal, setShowFeesModal] = useState(false);

  // Add state and handler at the top of the component
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);

  async function handleLaunch() {
    setLaunching(true);
    setLaunchResult(null);
    try {
      // Prepare FormData
      const formData = new FormData();
      if (bannerFile) formData.append('collectionImage', bannerFile);
      // Add all NFT images and metadata
      const metadataList: Array<Record<string, any>> = [];
      extractedPairs.forEach((pair, idx) => {
        // Append the image file with a unique name
        formData.append('images', pair.imgFile, pair.imgFile.name);
        // Add metadata, include the image filename for matching
        metadataList.push({ ...pair.metadata, image: pair.imgFile.name, name: pair.imgFile.name.replace(/\.(png|jpg|jpeg|gif)$/i, '.json') });
      });
      formData.append('metadata', JSON.stringify(metadataList));
      formData.append('collectionInfo', JSON.stringify({
        name: collectionName,
        description: collectionDesc,
      }));
      const res = await fetch('/api/launch', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setLaunchResult(data);
    } catch (e: any) {
      setLaunchResult({ error: e.message || 'Failed to launch' });
    }
    setLaunching(false);
  }

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
        {mounted && (
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
        )}
      </div>
      {/* Page Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
        {/* Top Section: Big Heading and Subtext */}
        <div className="w-full max-w-5xl mx-auto px-4 pt-8 pb-2 text-left">
          <h2 className="text-3xl font-extrabold mb-1" style={{ color: '#32CD32' }}>
            Launch NFTs on Pepe Unchained
          </h2>
          <span className="text-lg text-green-200 font-medium">
            Start by generating and exporting your collection metadata{' '}
            <a href="https://lilipad-nft-export.vercel.app" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-400">here</a>
          </span>
        </div>
        {/* Cards Section or Form */}
        {!showForm ? (
        <div className="w-full max-w-5xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Launch an NFT */}
              <div className="flex flex-col items-center justify-center bg-[#111] border-2 border-[#32CD32] rounded-2xl shadow-lg p-8 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] min-h-[220px] cursor-pointer text-center">
                <FaArrowUp className="text-[#32CD32] mb-4" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
                <span className="text-2xl font-extrabold text-white mb-2">Mint a Single NFT</span>
                <span className="text-base text-green-200">Quickly mint one NFT into any of your collections.</span>
              </div>
              {/* Card 2: Launch a Collection (Generative) */}
              <div className="flex flex-col items-center justify-center bg-[#111] border-2 border-[#32CD32] rounded-2xl shadow-lg p-8 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] min-h-[220px] cursor-pointer text-center">
                <FaLayerGroup className="text-[#FFD600] mb-4" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
                <span className="text-2xl font-extrabold text-white mb-2">Create Generative Collection</span>
                <span className="text-base text-green-200">Launch a collection using layers and traits for generative art.</span>
              </div>
              {/* Card 3: Launch a Collection (One-of-One) */}
              <div
                className="flex flex-col items-center justify-center bg-[#111] border-2 border-[#32CD32] rounded-2xl shadow-lg p-8 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] min-h-[220px] cursor-pointer text-center"
              onClick={() => {
                  if (!isConnected) {
                    setShowModal(true);
                } else {
                    setShowForm(true);
                  }
                }}
              >
                <FaThLarge className="text-[#22c55e] mb-4" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
                <span className="text-2xl font-extrabold text-white mb-2">Create One-of-One Collection</span>
                <span className="text-base text-green-200">Build a collection of unique, individually uploaded NFTs.</span>
              </div>
            </div>
            {/* Modal for connect wallet */}
            {showModal && (
              <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-black border-2 border-[#32CD32] rounded-xl shadow-xl p-6 max-w-xs w-full flex flex-col items-center">
                  <span className="text-base font-bold text-white mb-3">
                    Connect your wallet to create a
                    <span className="block text-white text-lg text-center mx-auto">collection</span>
                  </span>
                  <ConnectButtonBase.Custom>
                    {({ openConnectModal }) => (
                      <button
                        onClick={() => { openConnectModal(); setShowModal(false); }}
                        className="px-4 py-2 bg-yellow-400 text-black border-2 border-black rounded-full font-bold hover:bg-yellow-300 transition-colors text-base mt-2"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </ConnectButtonBase.Custom>
                  <button
                    onClick={() => setShowModal(false)}
                    className="mt-3 text-[#32CD32] underline hover:text-yellow-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
        {/* Show form below the top section, not as a replacement */}
        {showForm && !showUploadBox && (
          <div className="w-full max-w-5xl mx-auto px-4 py-12 text-left">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-6 text-yellow-300">Create One-of-One Collection</h2>
              <form className="flex flex-col gap-8">
                {/* Group: Main Info (Name, Description, Vanity URL) */}
                <div className="p-5 rounded-xl bg-[#181818] border border-[#333] flex flex-col gap-5">
                  {/* Collection Name */}
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-white">Collection Name</span>
                    <input
                      type="text"
                      className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                      value={collectionName}
                      onChange={e => setCollectionName(e.target.value)}
                      placeholder="Enter collection name"
                      required
                    />
                  </label>
                  {/* Description */}
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-white">Description</span>
                    <textarea
                      className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                      value={collectionDesc}
                      onChange={e => setCollectionDesc(e.target.value)}
                      placeholder="Enter collection description"
                      rows={4}
                      required
                    />
                  </label>
                  {/* Vanity URL with validation */}
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-white">Vanity URL</span>
                    <input
                      type="text"
                      className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                      value={vanityUrl}
                      onChange={handleVanityUrlChange}
                      placeholder="e.g. my-cool-collection"
                      required
                    />
                    <span className="text-xs text-green-200 mt-1">https://lilipad.art/collection/{vanityUrl || 'your-collection-name'}</span>
                    {vanityUrlError && (
                      <span className="text-red-400 text-xs mt-1">{vanityUrlError}</span>
                    )}
                  </label>
                </div>
                {/* Group: Socials */}
                <div className="p-5 rounded-xl bg-[#181818] border border-[#333] flex flex-col gap-5">
                  {/* Twitter Username and Instagram */}
                  <div className="flex gap-4">
                    <label className="flex-1 flex flex-col gap-2">
                      <span className="font-semibold text-white">Twitter Username</span>
                      <input
                        type="text"
                        className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your Twitter username"
                        required
                      />
                    </label>
                    <label className="flex-1 flex flex-col gap-2">
                      <span className="font-semibold text-white">Instagram (optional)</span>
                      <input
                        type="text"
                        className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                        placeholder="Instagram handle"
                      />
                    </label>
                  </div>
                </div>
                {/* Group: Banner Upload */}
                <div className="p-5 rounded-xl bg-[#181818] border border-[#333] flex flex-col gap-2 w-full max-w-2xl">
                  <span className="font-semibold text-white mb-1">Banner Image</span>
                  {bannerPreview && (
                    <img src={bannerPreview} alt="Banner Preview" className="mb-2 rounded-lg max-h-24 max-w-xs object-contain border border-[#444] mx-auto" />
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#222] text-white rounded-lg border border-[#444] hover:bg-[#32CD32] hover:text-black font-semibold transition-colors w-fit"
                    onClick={e => { e.preventDefault(); document.getElementById('banner-upload-input')?.click(); }}
                  >
                    Select Image
                  </button>
                  <input
                    id="banner-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </div>
                {/* Group: Website and Royalty */}
                <div className="p-5 rounded-xl bg-[#181818] border border-[#333] flex flex-col gap-5">
                  {/* Website with validation */}
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-white">Website</span>
                    <input
                      type="text"
                      className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                    {website && !/^https:\/\/.+\..+/.test(website) && (
                      <span className="text-red-400 text-xs mt-1">Website must be a valid https:// URL</span>
                    )}
                  </label>
                  {/* Royalty with validation */}
                  <label className="flex flex-col gap-2">
                    <span className="font-semibold text-white">Royalty (%)</span>
                    <input
                      type="number"
                      className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                      value={royalty}
                      onChange={handleRoyaltyChange}
                      placeholder="e.g. 5"
                      min={0}
                      max={50}
                      required
                    />
                    <span className="text-xs text-green-300">Max 50%</span>
                    {royalty && (Number(royalty) > 50) && (
                      <span className="text-red-400 text-xs mt-1">Royalty cannot exceed 50%</span>
                    )}
                  </label>
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    className={`px-6 py-2 bg-[#32CD32] text-black font-bold rounded-full border-2 border-[#32CD32] transition-colors ${(!isFormValid || !isConnected) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-400 hover:text-black'}`}
                    onClick={() => isFormValid && isConnected && setShowUploadBox(true)}
                    disabled={!isFormValid || !isConnected}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showForm && showUploadBox && extractedPairs.length === 0 && (
          <div className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-start justify-center">
            <div className="max-w-2xl w-full flex flex-col items-start justify-center">
              <label htmlFor="zip-upload-input" className="w-full border-2 border-dashed border-[#32CD32] rounded-2xl bg-gradient-to-br from-[#181818] via-[#232323] to-[#181818] flex flex-col items-center justify-center py-24 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 shadow-lg">
                <FaCloudUploadAlt className="mb-8" style={{ fontSize: 96, color: '#e5e7eb' }} />
                <span className="text-3xl font-extrabold text-white mb-3">Upload your collection folder</span>
                <span className="text-lg text-green-200 mb-4 font-medium">with image and metadata (ZIP file)</span>
                <input
                  id="zip-upload-input"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={e => setZipFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                />
                {zipFile && (
                  <span className="mt-4 text-green-300 font-semibold">Selected: {zipFile.name}</span>
                )}
              </label>
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  className="px-6 py-2 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors"
                  onClick={() => setShowUploadBox(false)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-[#32CD32] text-black font-bold rounded-full border-2 border-[#32CD32] hover:bg-yellow-400 hover:text-black transition-colors"
                  onClick={handleExtractZip}
                  disabled={!zipFile || isExtracting}
                >
                  {isExtracting ? 'Extracting...' : 'Next'}
                </button>
              </div>
              {extractError && <div className="text-red-400 mt-4">{extractError}</div>}
            </div>
          </div>
        )}
        {showForm && showUploadBox && extractedPairs.length > 0 && !showFinalSummary && (
          <div className="w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-start justify-center relative min-h-[600px]">
            <div className="max-w-2xl w-full flex flex-col items-start justify-center">
              <div className="w-full mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Preview Collection Items</h3>
                <div className="flex flex-row gap-3 overflow-x-auto no-scrollbar w-full pb-2">
                  {extractedPairs.map(pair => (
                    <div key={pair.num} className="flex flex-col overflow-hidden shadow-lg bg-black w-full max-w-[170px] flex-shrink-0">
                      <img src={pair.imgUrl} alt={`NFT ${pair.num}`} className="w-full h-[150px] object-cover" style={{ maxWidth: '600px', maxHeight: '600px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                      <div className="flex flex-col items-start px-3 py-2 bg-black w-full border border-[#32CD32] border-t-0 rounded-b-2xl">
                        <div className="font-bold text-white text-sm truncate w-full">{pair.metadata.name || `#${pair.num}`}</div>
                        {pair.metadata.description && (
                          <div className="text-xs text-gray-400 mb-1 w-full truncate">{pair.metadata.description}</div>
                        )}
                        {Array.isArray(pair.metadata.attributes) && pair.metadata.attributes.map((attr: any, idx: number) => (
                          <div key={idx} className="flex flex-row w-full mt-1 items-center text-xs">
                            <span className="text-[10px] text-gray-400 flex-1 truncate whitespace-nowrap overflow-hidden">{attr.trait_type}</span>
                            <span className="text-xs text-yellow-300 font-semibold text-right ml-2 break-words truncate whitespace-nowrap overflow-hidden">{String(attr.value)}</span>
                          </div>
                        ))}
                        {!samePrice && (
                          <div className="mt-2 w-full">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="w-24 py-1 px-2 rounded border border-[#32CD32] bg-black text-white text-xs focus:outline-none focus:border-yellow-400"
                              placeholder="Set price (PEPU)"
                              value={individualPrices[pair.num] || ''}
                              onChange={e => setIndividualPrices({ ...individualPrices, [pair.num]: e.target.value })}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pricing section */}
                <div className="w-full mt-6 flex flex-col gap-3 items-start">
                  <div className="flex items-center gap-4">
                    <span className="text-white font-semibold">Pricing:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        onChange={() => setSamePrice(!samePrice)}
                        checked={samePrice}
                        onColor="#32CD32"
                        offColor="#222"
                        uncheckedIcon={false}
                        checkedIcon={false}
                        height={20}
                        width={40}
                      />
                      <span className="text-sm text-white">Use same price for all</span>
                    </label>
                  </div>
                  {samePrice ? (
                    <div className="flex flex-col gap-1 mt-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-32 py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="Enter price for all NFTs (PEPU)"
                        value={allPrice}
                        onChange={e => setAllPrice(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 mt-1">Set price for each NFT below.</div>
                  )}
                  {extractedPairs.length > 0 && (
                    <span className="text-xs text-green-200 mt-1">Total supply: {extractedPairs.length}</span>
                  )}
                  {/* Start/End date and time pickers */}
                  <div className="flex flex-col gap-4 mt-4 w-full max-w-xl items-start">
                    <div className="flex items-center gap-4">
                      <span className="text-white text-sm font-semibold">Mint Start</span>
                      <input
                        type="date"
                        className="py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        value={startDate}
                        min={nowISODate}
                        onChange={e => setStartDate(e.target.value)}
                        required
                      />
                      <input
                        type="time"
                        className="py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        value={startTime}
                        min={startDate === nowISODate ? nowISOTime : undefined}
                        onChange={e => setStartTime(e.target.value)}
                        required
                      />
                      <span className="text-xs text-gray-400">UTC</span>
                    </div>
                    {startDateError && <span className="text-xs text-red-400">{startDateError}</span>}
                    {startTimeError && <span className="text-xs text-red-400">{startTimeError}</span>}
                    <div className="flex items-center gap-4">
                      <span className="text-white text-sm font-semibold">Mint End</span>
                      <input
                        type="date"
                        className="py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        value={endDate}
                        min={startDate || nowISODate}
                        onChange={e => setEndDate(e.target.value)}
                        required
                      />
                      <input
                        type="time"
                        className="py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        value={endTime}
                        min={endDate === startDate ? startTime : undefined}
                        onChange={e => setEndTime(e.target.value)}
                        required
                      />
                      <span className="text-xs text-gray-400">UTC</span>
                    </div>
                    {endDateError && <span className="text-xs text-red-400">{endDateError}</span>}
                    {endTimeError && <span className="text-xs text-red-400">{endTimeError}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  className="px-6 py-2 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors"
                  onClick={() => { setExtractedPairs([]); setZipFile(null); }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`px-6 py-2 bg-[#32CD32] text-black font-bold rounded-full border-2 border-[#32CD32] transition-colors ${(!isMintPriceValid || !isDateTimeValid) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-400 hover:text-black'}`}
                  onClick={() => (isMintPriceValid && isDateTimeValid) && setShowFinalSummary(true)}
                  disabled={!isMintPriceValid || !isDateTimeValid}
                >
                  Next
                </button>
              </div>
            </div>
            {/* Fees & Launch Guide link at bottom right, opens modal */}
            <button onClick={() => setShowFeesModal(true)} className="absolute right-4 bottom-4 text-[#32CD32] underline text-sm hover:text-yellow-300 transition-colors z-20">Fees & Launch Guide</button>
            {showFeesModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-[#181818] border-2 border-[#32CD32] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col gap-4">
                  <button onClick={() => setShowFeesModal(false)} className="absolute top-3 right-4 text-[#32CD32] text-xl font-bold hover:text-yellow-300">&times;</button>
                  <h2 className="text-2xl font-extrabold text-yellow-300 mb-2">Lilipad Launch Fees</h2>
                  <div className="text-green-200 font-semibold">Launching a collection on Lilipad requires:</div>
                  <ul className="list-disc list-inside text-green-100 text-base ml-4">
                    <li><span className="font-bold text-yellow-300">$10</span> (in PEPU) one-time launch fee</li>
                    <li><span className="font-bold text-yellow-300">5%</span> of the total mint price of all NFTs in your collection</li>
                  </ul>
                  <div className="mt-2 text-green-100 text-base">
                    <span className="font-bold text-[#32CD32]">Example:</span><br/>
                    If you launch a collection with <span className="font-bold">100 NFTs</span> and set the mint price to <span className="font-bold">500 PEPU</span> each:<br/>
                    <span className="ml-4">• Launch fee: <span className="font-bold text-yellow-300">$10</span> (in PEPU)</span><br/>
                    <span className="ml-4">• 5% of total mint: <span className="font-bold text-yellow-300">5% × (100 × 500 PEPU) = 2,500 PEPU</span></span><br/>
                    <span className="ml-4">• <span className="font-bold text-green-200">Total paid: $10 (in PEPU) + 2,500 PEPU</span></span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Fees are required to help support the platform and ensure a high-quality experience for all creators and collectors.</div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Final summary section */}
        {showForm && showUploadBox && showFinalSummary && (
          <div className="w-full min-h-[70vh] flex flex-col justify-start items-start bg-black relative">
            {/* Big rectangular banner image with thinner green border, left-aligned */}
            {bannerPreview && (
              <div className="w-full max-w-5xl mx-auto flex justify-start items-center mt-6 px-4">
                <img src={bannerPreview} alt="Banner" className="w-[600px] h-[320px] object-cover rounded-2xl border-2 border-[#32CD32] bg-black" />
              </div>
            )}
            {/* Info below image, left-aligned, compact spacing and smaller text */}
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 px-4 pt-4">
              <h2 className="text-2xl font-extrabold text-yellow-300 leading-tight mb-1">{collectionName}</h2>
              <div className="flex flex-row gap-2 flex-wrap mb-1">
                {username && (
                  <a href={`https://x.com/${username.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 1200 1227"><path d="M1152.6 0H885.2L600.3 418.6 315.4 0H47.9l404.7 610.6L0 1227h267.4l285.2-418.6 285.2 418.6h267.4L795.2 610.6zM600.3 753.2L385.7 1087.2H814.9z"/></svg>
                    <span className="truncate">@{username.replace(/^@/, '')}</span>
                  </a>
                )}
                {website && (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 2a6.5 6.5 0 0 0 0 13 6.5 6.5 0 0 0 0-13zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg>
                    <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {instagram && (
                  <a href={`https://instagram.com/${instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5zm0 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6.25 1.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                    <span className="truncate">@{instagram.replace(/^@/, '')}</span>
                  </a>
                )}
              </div>
              <div className="text-green-100 text-sm font-medium truncate max-w-2xl mb-1">{collectionDesc}</div>
              {/* Stats row */}
              <div className="flex flex-row gap-6 items-center mb-1">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Mint Price</span>
                  <span className="text-base font-mono font-bold text-white">{samePrice ? (allPrice || '—') : 'Varies'} <span className="text-xs text-green-200">PEPU</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Total Supply</span>
                  <span className="text-base font-mono font-bold text-white">{extractedPairs.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Royalty</span>
                  <span className="text-base font-mono font-bold text-white">{royalty}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Mint Starts In</span>
                  {(() => {
                    const now = new Date();
                    const start = mintStartISO ? new Date(mintStartISO) : null;
                    const end = mintEndISO ? new Date(mintEndISO) : null;
                    if (start && now < start) {
                      return (
                        <button className="flex items-center gap-2 px-3 py-1 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors text-sm cursor-default mt-0.5" disabled>
                          <svg className="animate-spin mr-1" width="14" height="14" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="4" opacity="0.2"/><path d="M4 12a8 8 0 018-8" stroke="#000" strokeWidth="4" strokeLinecap="round"/></svg>
                          {countdown}
                        </button>
                      );
                    } else if (start && end && now >= start && now <= end) {
                      return <button className="px-3 py-1 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors text-sm mt-0.5">Mint</button>;
                    } else if (end && now > end) {
                      return <span className="text-red-400 font-bold text-sm mt-0.5">Minting ended</span>;
                    } else {
                      return null;
                    }
                  })()}
                </div>
              </div>
              {/* Back button, left-aligned */}
              <div className="flex gap-4 mt-3">
                <button
                  type="button"
                  className="px-5 py-1.5 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors text-sm"
                  onClick={() => setShowFinalSummary(false)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={`px-5 py-1.5 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors text-sm ${launching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleLaunch}
                  disabled={launching}
                >
                  {launching ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </div>
          </div>
        )}
        {launchResult && (
          <div className="mt-4 w-full max-w-2xl bg-[#181818] border border-[#32CD32] rounded-lg p-4 text-sm text-white">
            {launchResult.error ? (
              <span className="text-red-400 font-bold">{launchResult.error}</span>
            ) : (
              <>
                <div className="text-green-300 font-bold mb-2">Launch Successful!</div>
                <div className="break-all">Collection Image CID: {launchResult.collectionImageCid}</div>
                <div className="break-all">Collection Metadata CID: {launchResult.collectionMetadataCid}</div>
                <div className="break-all">NFT Image CIDs: {JSON.stringify(launchResult.imageCids)}</div>
                <div className="break-all">NFT Metadata CIDs: {JSON.stringify(launchResult.updatedMetadataCids)}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 