'use client';
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { FaWallet, FaArrowUp, FaLayerGroup, FaThLarge, FaCloudUploadAlt } from "react-icons/fa";
import { ConnectButton as ConnectButtonBase } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import JSZip from 'jszip';
import Switch from 'react-switch';
import { ethers } from 'ethers';
import factoryABI from '../../abi/LiliPadFactory.json';

// Spinner component
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-[#32CD32] inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
  </svg>
);

interface LaunchResult {
  error?: string;
  collectionImageCid?: string;
  collectionMetadataCid?: string;
  collectionAddress?: string;
  collectionURL?: string;
  imageCids?: Record<string, string>;
  updatedMetadataCids?: Record<string, string>;
  metadataFolderCID?: string;
  imagesFolderCID?: string;
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
  const { isConnected, address } = useAccount();
  const [walletBalance, setWalletBalance] = useState<bigint | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true);
  useEffect(() => { setMounted(true); }, []);

  // Form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');
  const [collectionSymbol, setCollectionSymbol] = useState('');
  const [vanityUrl, setVanityUrl] = useState('');
  const [vanityUrlError, setVanityUrlError] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [royalty, setRoyalty] = useState('');
  const [royaltyRecipient, setRoyaltyRecipient] = useState('');
  const [samePrice, setSamePrice] = useState(true);
  const [allPrice, setAllPrice] = useState('');
  const [individualPrices, setIndividualPrices] = useState<{ [key: string]: string }>({});

  // Vanity URL validation
  function validateVanityUrl(value: string) {
    if (value.length < 4) return 'Must be at least 4 characters';
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

  // Add helper to recursively extract files from a JSZip folder
  async function extractFolder(zipFolder: JSZip, parentPath = ''): Promise<File[]> {
    const files: File[] = [];
    for (const [name, entry] of Object.entries(zipFolder.files)) {
      if (entry.dir) continue;
      const blob = await entry.async('blob');
      const file = new File([blob], name, { type: blob.type });
      files.push(file);
    }
    return files;
  }

  async function handleExtractZip() {
    if (!zipFile) return;
    setIsExtracting(true);
    setExtractError('');
    try {
      const zip = await JSZip.loadAsync(zipFile);
      // Find images and metadata folders
      const imagesFiles: File[] = [];
      const metadataFiles: File[] = [];
      for (const [name, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        if (/images\//i.test(name)) {
          const blob = await entry.async('blob');
          imagesFiles.push(new File([blob], name.replace(/^.*images\//i, ''), { type: blob.type }));
        } else if (/metadata\//i.test(name)) {
          const blob = await entry.async('blob');
          metadataFiles.push(new File([blob], name.replace(/^.*metadata\//i, ''), { type: blob.type }));
        }
      }
      setImagesFolderFiles(imagesFiles);
      setMetadataFolderFiles(metadataFiles);
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
      if (pairs.length < 5) {
        setExtractError('You must upload at least 5 NFTs in your collection.');
        setExtractedPairs([]);
        return;
      }
    } catch (e) {
      setExtractError('Failed to extract or parse ZIP.');
    }
    setIsExtracting(false);
  }

  // Validation for Next button
  const isFormValid =
    collectionName.trim().length > 0 &&
    collectionSymbol.trim().length > 0 &&
    collectionDesc.trim().length > 0 &&
    vanityUrlError === '' &&
    vanityUrl.trim().length > 0 &&
    username.trim().length > 0 &&
    (!website || /^https:\/\/.+\..+/.test(website)) &&
    royalty !== '' && Number(royalty) <= 50 &&
    royaltyRecipient.trim().length > 0;

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
  const isMintPriceValid = extractedPairs.length > 0 && 
    (samePrice ? (!!allPrice && !isNaN(Number(allPrice)) && Number(allPrice) > 0) : 
    Object.values(individualPrices).every(p => !!p && !isNaN(Number(p)) && Number(p) > 0));

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

  // Add state for extracted images and metadata folders
  const [imagesFolderFiles, setImagesFolderFiles] = useState<File[]>([]);
  const [metadataFolderFiles, setMetadataFolderFiles] = useState<File[]>([]);

  // Add state for launch progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressError, setProgressError] = useState('');

  const progressSteps = [
    'Uploading images to IPFS...',
    'Updating NFT metadata...',
    'Uploading NFT metadata to IPFS...',
    'Uploading collection banner to IPFS...',
    'Uploading collection metadata to IPFS...',
    'Done!'
  ];

  // Add state for fee calculation and approval
  const [showFeePreviewModal, setShowFeePreviewModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState('');
  const [feeApproved, setFeeApproved] = useState(false);

  // Helper to calculate fees
  function calculateFees() {
    const launchFee = 3; // Hardcoded for now
    const platformFeeBps = 500; // 5%
    const maxSupply = extractedPairs.length;
    const mintPrice = Number(allPrice);
    const platformFee = (maxSupply > 0 && mintPrice > 0) ? (maxSupply * mintPrice * platformFeeBps) / 10000 : 0;
    const totalFee = launchFee + platformFee;
    return { launchFee, platformFee, totalFee };
  }

  // Helper to append files to FormData with relative paths
  function appendFilesWithRelativePath(formData: FormData, files: File[], key: string, folderPrefix: string) {
    files.forEach(file => {
      // Try to use webkitRelativePath if available, else simulate
      const relPath = (file as any).webkitRelativePath || `${folderPrefix}/${file.name}`;
      formData.append(key, file, relPath);
    });
  }

  // Helper to sanitize collection name for folder naming
  function sanitizeName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleLaunch() {
    // Start the unified progress modal flow
    setLaunching(true);
    setLaunchResult(null);
    setShowProgressModal(true);
    setProgressStep(0);
    setProgressError('');
    
    // Calculate fees for display
    const { launchFee, platformFee, totalFee } = calculateFees();
    setCalculatedFee(totalFee.toString());
    
    // The actual launch process will be triggered by the "Approve & Continue" button
    // This function just sets up the modal
  }

  async function startLaunchProcess() {
    try {
      // Step 1: Upload images folder
      setProgressStep(1);
      setProgressMessage('Uploading images...');
      const sanitizedCollectionName = sanitizeName(collectionName || 'collection');
      const imagesFormData = new FormData();
      appendFilesWithRelativePath(imagesFormData, imagesFolderFiles, 'images', `${sanitizedCollectionName}-images`);
      imagesFormData.append('uploadType', 'images');
      const imagesRes = await fetch('/api/launch', {
        method: 'POST',
        body: imagesFormData,
      });
      const imagesData = await imagesRes.json();
      if (imagesData.error) throw new Error(imagesData.error);
      const imagesFolderCID = imagesData.imagesFolderCID.replace('ipfs://', '');

      // Step 2: Update metadata files
      setProgressStep(2);
      setProgressMessage('Updating metadata...');
      const updatedMetadataFiles: File[] = [];
      for (const file of metadataFolderFiles) {
        const text = await file.text();
        const meta = JSON.parse(text);
        const num = file.name.replace('.json', '');
        meta.image = `ipfs://${imagesFolderCID}/${num}.png`;
        updatedMetadataFiles.push(new File([JSON.stringify(meta)], file.name, { type: 'application/json' }));
      }

      // Step 3: Upload updated metadata folder
      setProgressStep(3);
      setProgressMessage('Uploading metadata...');
      const metadataFormData = new FormData();
      appendFilesWithRelativePath(metadataFormData, updatedMetadataFiles, 'metadata', `${sanitizedCollectionName}-metadata`);
      metadataFormData.append('uploadType', 'metadata');
      metadataFormData.append('collectionInfo', JSON.stringify({
        name: collectionName,
        description: collectionDesc,
      }));
      if (bannerFile) metadataFormData.append('collectionImage', bannerFile);
      metadataFormData.append('imagesFolderCID', imagesFolderCID);
      const metadataRes = await fetch('/api/launch', {
        method: 'POST',
        body: metadataFormData,
      });
      const metadataData = await metadataRes.json();
      if (metadataData.error) throw new Error(metadataData.error);

      // Step 4: Generate and upload collection-level metadata
      setProgressStep(4);
      setProgressMessage('Creating collection metadata...');
      const metadataFolderCID = metadataData.metadataFolderCID?.replace('ipfs://', '');
      const xUrl = username ? `https://x.com/${username.replace(/^@/, '')}` : undefined;
      const igUrl = instagram ? `https://instagram.com/${instagram.replace(/^@/, '')}` : undefined;
      
      const collectionMetadata = {
        name: collectionName,
        description: collectionDesc,
        image: metadataData.collectionImageCid?.replace('ipfs://', '') ? `ipfs://${metadataData.collectionImageCid.replace('ipfs://', '')}` : undefined,
        external_link: website || undefined,
        seller_fee_basis_points: royalty ? Math.round(Number(royalty) * 100) : undefined,
        fee_recipient: royaltyRecipient || undefined,
        socials: {
          x: xUrl,
          instagram: igUrl,
          website: website || undefined,
        },
        baseURI: metadataFolderCID ? `ipfs://${metadataFolderCID}` : undefined,
        total_supply: extractedPairs.length,
        items: extractedPairs.map(pair => ({ name: pair.metadata.name, num: pair.num })),
        mint_start: mintStartISO || undefined,
        mint_end: mintEndISO || undefined,
      };
      
      const collectionMetadataFile = new File([
        JSON.stringify(collectionMetadata, null, 2)
      ], 'collection.json', { type: 'application/json' });
      
      const collectionMetaFormData = new FormData();
      collectionMetaFormData.append('uploadType', 'collection-metadata');
      collectionMetaFormData.append('collectionMetadata', collectionMetadataFile);
      if (metadataData.collectionImageCid) collectionMetaFormData.append('collectionImageCid', metadataData.collectionImageCid);
      if (metadataFolderCID) collectionMetaFormData.append('metadataFolderCID', metadataFolderCID);
      
      const collectionMetaRes = await fetch('/api/launch', {
        method: 'POST',
        body: collectionMetaFormData,
      });
      const collectionMetaData = await collectionMetaRes.json();
      if (collectionMetaData.error) throw new Error(collectionMetaData.error);

      // Step 5: Deploy collection contract
      setProgressStep(5);
      setProgressMessage('Deploying collection contract...');
      
      // Get the factory contract address from environment
      const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
      if (!factoryAddress) {
        throw new Error('Factory address not configured');
      }

      // Connect to the factory contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = new ethers.Contract(factoryAddress, factoryABI.abi, signer);

      // Convert price to wei
      const mintPriceWei = ethers.parseEther(allPrice || '0');
      
      // Calculate fees for the contract call
      const { launchFee, platformFee, totalFee } = calculateFees();
      // Convert totalFee (in ether) to wei
      const totalFeeWei = ethers.parseEther(totalFee.toString());
      // Deploy the collection
      const tx = await factory.deployCollection(
        collectionName, // name
        collectionSymbol, // symbol
        `ipfs://${metadataFolderCID}`, // baseURI
        `ipfs://${collectionMetaData.collectionMetadataCid}`, // collectionURI
        extractedPairs.length, // maxSupply
        mintPriceWei, // mintPrice
        royalty ? Math.round(Number(royalty) * 100) : 0, // royaltyBps
        royaltyRecipient, // royaltyRecipient
        Math.floor(new Date(mintStartISO).getTime() / 1000), // mintStart
        Math.floor(new Date(mintEndISO).getTime() / 1000), // mintEnd
        vanityUrl, // vanity
        { value: totalFeeWei }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      // Listen for the correct event name that emits the collection address
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === 'CollectionDeployedMain';
        } catch {
          return false;
        }
      });
      
      let collectionAddress = null;
      if (event) {
        const parsed = factory.interface.parseLog(event);
        collectionAddress = parsed?.args?.collection;
      }

      console.log('Collection deployed to:', collectionAddress);

      // Step 6: Show final results
      setProgressStep(6);
      setProgressMessage('Launch complete!');

      setLaunchResult({
        collectionAddress: collectionAddress,
        collectionURL: `ipfs://${collectionMetaData.collectionMetadataCid}`,
        metadataFolderCID: metadataFolderCID,
        imagesFolderCID: imagesData.imagesFolderCID,
      });
      
    } catch (e: any) {
      setProgressError(e.message || 'Failed to launch');
      setProgressMessage('Error');
    }
  }

  useEffect(() => {
    if (showProgressModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showProgressModal]);

  // Fetch wallet balance when fee modal is shown and address is available
  useEffect(() => {
    async function checkBalance() {
      if (!showProgressModal || !address || progressStep !== 0) return;
      setCheckingBalance(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(address);
        setWalletBalance(bal);
        // Calculate total fee in wei
        const { totalFee } = calculateFees();
        const totalFeeWei = ethers.parseEther(totalFee.toString());
        setHasEnoughBalance(bal >= totalFeeWei);
      } catch (e) {
        setWalletBalance(null);
        setHasEnoughBalance(false);
      }
      setCheckingBalance(false);
    }
    checkBalance();
  }, [showProgressModal, address, progressStep]);

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
      <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 md:px-8">
        {/* Top Section: Big Heading and Subtext */}
          <div className="w-full px-0 sm:px-2 pt-4 pb-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: '#32CD32' }}>
              Launch NFTs on Pepe Unchained
          </h2>
            <span className="text-base sm:text-lg text-green-200 font-medium">
            Start by generating and exporting your collection metadata{' '}
            <a href="https://lilipad-nft-export.vercel.app" target="_blank" rel="noopener noreferrer" className="underline text-yellow-300 hover:text-yellow-400">here</a>
            </span>
          </div>
          {/* Cards Section or Form */}
          {!showForm ? (
          <div className="w-full px-0 sm:px-2 py-6 sm:py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-2 md:gap-x-4 justify-center place-items-center">
                {/* Card 1: Launch an NFT */}
                <div className="flex flex-col items-center justify-center bg-[#111] border-2 border-[#32CD32] rounded-2xl shadow-lg p-2 sm:p-3 py-4 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] w-full aspect-square max-w-[420px] cursor-pointer text-center">
                  <FaArrowUp className="text-[#32CD32] mb-3" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
                  <span className="text-lg sm:text-2xl font-extrabold text-white mb-2">Mint a Single NFT</span>
                  <span className="text-base sm:text-lg text-green-200">Quickly mint one NFT into any of your collections.</span>
                  <span className="text-sm sm:text-base text-green-100 mt-1">Perfect for single drops, 1/1s, or testing your collection setup.</span>
        </div>
                {/* Card 2: Launch a Collection (One-of-One) */}
                <div
                  className="flex flex-col items-center justify-center bg-[#111] border-2 border-[#32CD32] rounded-2xl shadow-lg p-2 sm:p-3 py-4 transition-transform hover:scale-105 hover:border-yellow-400 hover:shadow-[0_0_8px_2px_#FFD600] w-full aspect-square max-w-[420px] cursor-pointer text-center"
              onClick={() => {
                    if (!isConnected) {
                      setShowModal(true);
                } else {
                      setShowForm(true);
                    }
                  }}
                >
                  <FaThLarge className="text-[#22c55e] mb-3" style={{ fontSize: 56, minHeight: 56, minWidth: 56 }} />
                  <span className="text-lg sm:text-2xl font-extrabold text-white mb-2">Launch your NFT Collection</span>
                  <span className="text-base sm:text-lg text-green-200">Upload and launch a full NFT collection with images and metadata in one go.</span>
                  <span className="text-sm sm:text-base text-green-100 mt-1">Supports bulk upload, custom metadata, and all standard NFT formats.</span>
                </div>
              </div>
            {/* Modal for connect wallet */}
            {showModal && (
                <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xs">
                  <div className="bg-black border-2 border-[#32CD32] rounded-xl shadow-xl p-4 sm:p-6 w-full flex flex-col items-center">
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
            <div className="w-full px-0 sm:px-2 py-6 text-left">
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
                    {/* Collection Symbol */}
                    <label className="flex flex-col gap-2">
                      <span className="font-semibold text-white">Collection Symbol</span>
                      <input
                        type="text"
                        className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                        value={collectionSymbol}
                        onChange={e => {
                          // Convert to uppercase and remove spaces and special characters
                          const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          setCollectionSymbol(value);
                        }}
                        placeholder="e.g. COOL"
                        maxLength={10}
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
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <label className="flex-1 flex flex-col gap-2 w-full">
                        <span className="font-semibold text-white">Twitter Username</span>
                        <input
                          type="text"
                          className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all w-full"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          placeholder="Enter your Twitter username"
                          required
                        />
                      </label>
                      <label className="flex-1 flex flex-col gap-2 w-full">
                        <span className="font-semibold text-white">Instagram (optional)</span>
                        <input
                          type="text"
                          className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all w-full"
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
                        step="any"
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
                    {/* Royalty Recipient */}
                    <label className="flex flex-col gap-2">
                      <span className="font-semibold text-white">Royalty Recipient Address</span>
                      <input
                        type="text"
                        className="py-3 px-4 rounded-xl border-2 border-[#444] bg-[#181818] text-white focus:outline-none focus:border-[#32CD32] transition-all"
                        value={royaltyRecipient}
                        onChange={e => setRoyaltyRecipient(e.target.value)}
                        placeholder="0x..."
                        required
                      />
                      <span className="text-xs text-green-300">Address that will receive royalties</span>
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
            <div className="w-full px-0 sm:px-2 py-6 flex flex-col items-start justify-center">
              <div className="max-w-2xl w-full flex flex-col items-start justify-center">
                <label htmlFor="zip-upload-input" className="w-full border-2 border-dashed border-[#32CD32] rounded-2xl bg-gradient-to-br from-[#181818] via-[#232323] to-[#181818] flex flex-col items-center justify-center py-12 sm:py-24 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 shadow-lg">
                  <FaCloudUploadAlt className="mb-6 sm:mb-8" style={{ fontSize: 48, color: '#e5e7eb' }} />
                  <span className="text-xl sm:text-3xl font-extrabold text-white mb-2 sm:mb-3 text-center">Upload your collection folder</span>
                  <span className="text-base sm:text-lg text-green-200 mb-3 sm:mb-4 font-medium text-center">with image and metadata (ZIP file)</span>
                  <input
                    id="zip-upload-input"
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={e => {
                      setZipFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
                      setExtractedPairs([]);
                      setExtractError('');
                      setIsExtracting(false);
                    }}
                  />
                  {zipFile && (
                    <span className="mt-3 sm:mt-4 text-green-300 font-semibold text-xs sm:text-base text-center break-all">Selected: {zipFile.name}</span>
                  )}
                </label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors text-sm sm:text-base"
                    onClick={() => setShowUploadBox(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#32CD32] text-black font-bold rounded-full border-2 border-[#32CD32] hover:bg-yellow-400 hover:text-black transition-colors text-sm sm:text-base"
                    onClick={handleExtractZip}
                    disabled={!zipFile || isExtracting}
                  >
                    {isExtracting ? 'Extracting...' : 'Next'}
                  </button>
                </div>
                {extractError && <div className="text-red-400 mt-3 sm:mt-4 text-sm sm:text-base">{extractError}</div>}
              </div>
            </div>
          )}
          {showForm && showUploadBox && extractedPairs.length > 0 && !showFinalSummary && (
            <div className="w-full px-0 sm:px-2 py-6 flex flex-col items-start justify-center relative min-h-[600px]">
              <div className="max-w-2xl w-full flex flex-col items-start justify-center">
                <div className="w-full mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Preview Collection Items</h3>
                  <div className="flex flex-row gap-3 overflow-x-auto no-scrollbar w-full pb-2 sm:pb-2 mb-8 min-h-[260px]">
                    {extractedPairs.map(pair => (
                      <div key={pair.num} className="flex flex-col shadow-lg bg-black w-full max-w-[170px] flex-shrink-0 h-[260px]">
                        <img src={pair.imgUrl} alt={`NFT ${pair.num}`} className="w-full h-[140px] sm:h-[170px] object-cover rounded-t-2xl" style={{ maxWidth: '600px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                        <div className="flex flex-col flex-grow items-start px-3 py-2 bg-black w-full border border-[#32CD32] border-t-0 rounded-b-2xl min-h-[70px]">
                          <div className="font-bold text-white text-xs sm:text-sm truncate w-full">{pair.metadata.name || `#${pair.num}`}</div>
                          {pair.metadata.description && (
                            <div className="text-[10px] sm:text-xs text-gray-400 mb-1 w-full truncate">{pair.metadata.description}</div>
                          )}
                          {Array.isArray(pair.metadata.attributes) && pair.metadata.attributes.map((attr: any, idx: number) => (
                            <div key={idx} className="flex flex-row w-full mt-1 items-center text-[10px] sm:text-xs">
                              <span className="text-[9px] sm:text-[10px] text-gray-400 flex-1 truncate whitespace-nowrap overflow-hidden">{attr.trait_type}</span>
                              <span className="text-[10px] sm:text-xs text-yellow-300 font-semibold text-right ml-2 break-words truncate whitespace-nowrap overflow-hidden">{String(attr.value)}</span>
                            </div>
                          ))}
                          {!samePrice && (
                            <div className="mt-2 w-full">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="w-20 sm:w-24 py-1 px-2 rounded border border-[#32CD32] bg-black text-white text-[10px] sm:text-xs focus:outline-none focus:border-yellow-400"
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
                      <span className="text-white font-semibold">Mint Price:</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <input
                        type="number"
                        step="any"
                        className="w-32 py-2 px-3 rounded border border-[#32CD32] bg-black text-white text-sm focus:outline-none focus:border-yellow-400"
                        placeholder="1000 PEPU"
                        value={allPrice}
                        onChange={e => setAllPrice(e.target.value)}
                        min="1"
                      />
                     {allPrice && (Number(allPrice) <= 0) && (
                       <span className="text-red-400 text-xs mt-1">Mint price must be greater than 0</span>
                     )}
                    </div>
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
                      <li><span className="font-bold text-yellow-300">15,000 PEPU</span> one-time launch fee</li>
                      <li><span className="font-bold text-yellow-300">5%</span> of the total mint price of all NFTs in your collection</li>
                    </ul>
                    <div className="mt-2 text-green-100 text-base">
                      <span className="font-bold text-[#32CD32]">Example:</span><br/>
                      If you launch a collection with <span className="font-bold">100 NFTs</span> and set the mint price to <span className="font-bold">500 PEPU</span> each:<br/>
                      <span className="ml-4">• Launch fee: <span className="font-bold text-yellow-300">15,000 PEPU</span></span><br/>
                      <span className="ml-4">• 5% of total mint: <span className="font-bold text-yellow-300">5% × (100 × 500 PEPU) = 2,500 PEPU</span></span><br/>
                      <span className="ml-4">• <span className="font-bold text-green-200">Total paid: 15,000 PEPU + 2,500 PEPU</span></span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Fees are required to help support the platform and ensure a high-quality experience for all creators and collectors.</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Fee Approval Modal */}
          {showFeeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
              <div className="bg-[#181818] border-2 border-[#32CD32] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col gap-4">
                <button onClick={() => setShowFeeModal(false)} className="absolute top-3 right-4 text-[#32CD32] text-xl font-bold hover:text-yellow-300">&times;</button>
                <h2 className="text-2xl font-extrabold text-yellow-300 mb-2">Launch Fee Required</h2>
                <div className="text-green-200 font-semibold">To launch your collection, you need to pay:</div>
                <div className="bg-[#222] border border-[#32CD32] rounded-xl p-4">
                  <div className="text-green-100 text-base">
                    <div className="flex justify-between mb-2">
                      <span>Launch Fee:</span>
                      <span className="font-bold text-yellow-300">3 PEPU</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Platform Fee (5%):</span>
                      <span className="font-bold text-yellow-300">
                        {(() => {
                          const maxSupply = extractedPairs.length;
                          const mintPrice = Number(allPrice);
                          const platformFee = (maxSupply > 0 && mintPrice > 0) ? (maxSupply * mintPrice * 500) / 10000 : 0;
                          return `${platformFee.toLocaleString()} PEPU`;
                        })()}
                      </span>
                    </div>
                    <div className="border-t border-[#32CD32] pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-white">Total:</span>
                        <span className="font-bold text-yellow-300">{calculatedFee} PEPU</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  This fee will be deducted from your wallet when you approve the transaction.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFeeModal(false)}
                    className="flex-1 px-4 py-2 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setFeeApproved(true);
                      setShowFeeModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors"
                  >
                    Approve & Continue
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Final summary section */}
          {showForm && showUploadBox && showFinalSummary && (
            <div className="w-full min-h-[70vh] flex flex-col justify-start items-start bg-black relative">
              {/* Big rectangular banner image with thinner green border, left-aligned, responsive */}
              {bannerPreview && (
                <div className="w-full max-w-5xl mx-auto flex justify-start items-center mt-6 px-2 sm:px-4">
                  <img src={bannerPreview} alt="Banner" className="w-full sm:w-[600px] h-[180px] sm:h-[320px] object-cover rounded-2xl border-2 border-[#32CD32] bg-black" />
                </div>
              )}
              {/* Info below image, left-aligned, compact spacing and smaller text, responsive */}
              <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 px-2 sm:px-4 pt-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-yellow-300 leading-tight mb-1">{collectionName}</h2>
                <div className="flex flex-row gap-2 flex-wrap mb-1">
                  {username && (
                    <a href={`https://x.com/${username.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-xs sm:text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 1200 1227"><path d="M1152.6 0H885.2L600.3 418.6 315.4 0H47.9l404.7 610.6L0 1227h267.4l285.2-418.6 285.2 418.6h267.4L795.2 610.6zM600.3 753.2L385.7 1087.2H814.9z"/></svg>
                      <span className="truncate">@{username.replace(/^@/, '')}</span>
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-xs sm:text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zm0 2a6.5 6.5 0 0 0 0 13 6.5 6.5 0 0 0 0-13zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg>
                      <span className="truncate">{website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {instagram && (
                    <a href={`https://instagram.com/${instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#223] text-white text-xs sm:text-sm font-semibold hover:bg-[#32CD32] hover:text-black transition-colors">
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.25a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5zm0 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6.25 1.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
                      <span className="truncate">@{instagram.replace(/^@/, '')}</span>
                    </a>
                  )}
                </div>
                <div className="text-green-100 text-xs sm:text-sm font-medium truncate max-w-full sm:max-w-2xl mb-1">{collectionDesc}</div>
                {/* Stats row in a pill-like container, left-aligned, horizontal pill, vertical stat layout */}
                <div className="w-full mb-2">
                  <div className="inline-flex flex-row gap-2 sm:gap-6 items-start bg-[#232323] border border-[#32CD32] rounded-xl px-2 sm:px-3 py-2 max-w-full">
                    <div className="flex flex-col items-start min-w-[70px]">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Mint Price</span>
                      <span className="text-sm sm:text-base font-mono font-bold text-white">{allPrice || '—'} <span className="text-xs text-green-200">PEPU</span></span>
                    </div>
                    <div className="flex flex-col items-start min-w-[70px]">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Total Supply</span>
                      <span className="text-sm sm:text-base font-mono font-bold text-white">{extractedPairs.length}</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[70px]">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Royalty</span>
                      <span className="text-sm sm:text-base font-mono font-bold text-white">{royalty}%</span>
                    </div>
                    <div className="flex flex-col items-start min-w-[70px]">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#32CD32] uppercase tracking-widest mb-0.5">Mint Starts In</span>
                      {(() => {
                        const now = new Date();
                        const start = mintStartISO ? new Date(mintStartISO) : null;
                        const end = mintEndISO ? new Date(mintEndISO) : null;
                        if (start && now < start) {
                          // Calculate days, hours, minutes
                          const diff = start.getTime() - now.getTime();
                          const days = Math.floor(diff / 1000 / 60 / 60 / 24);
                          const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
                          const mins = Math.floor((diff / 1000 / 60) % 60);
                          // On mobile, show only the largest nonzero unit
                          return (
                            <button className="h-8 sm:h-9 min-w-[64px] sm:min-w-[80px] flex items-center justify-center bg-yellow-400 text-black font-bold border-2 border-yellow-400 rounded hover:bg-yellow-300 transition-colors text-xs sm:text-sm cursor-default mt-0.5 px-2" disabled>
                                <span className="block sm:hidden">
                                  {days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : `${mins}m`}
                                </span>
                                <span className="hidden sm:block">
                                  {days > 0 ? `${days}d ` : ''}{hours}h {mins}m
                                </span>
                              </button>
                          );
                        } else if (start && end && now >= start && now <= end) {
                          return <button className="h-8 sm:h-9 min-w-[64px] sm:min-w-[80px] flex items-center justify-center bg-yellow-400 text-black font-bold border-2 border-yellow-400 rounded hover:bg-yellow-300 transition-colors text-xs sm:text-sm mt-0.5 px-2">Mint</button>;
                        } else if (end && now > end) {
                          return <span className="text-red-400 font-bold text-xs sm:text-sm mt-0.5">Minting ended</span>;
                        } else {
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                </div>
                {/* Back button, left-aligned, responsive */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 w-full">
                  <button
                    type="button"
                    className="px-4 sm:px-5 py-1.5 bg-black text-[#32CD32] font-bold rounded-full border-2 border-[#32CD32] hover:bg-[#222] transition-colors text-xs sm:text-sm"
                    onClick={() => setShowFinalSummary(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={`px-4 sm:px-5 py-1.5 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors text-xs sm:text-sm ${launching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleLaunch}
                    disabled={launching}
                  >
                    {launching ? 'Launching...' : 'Launch'}
                  </button>
                </div>
          </div>
        </div>
          )}
      </div>
      {showProgressModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black bg-opacity-20" style={{ pointerEvents: 'all', backdropFilter: 'blur(1px)', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-0">
            <div className="bg-[#181818] border border-[#32CD32] rounded-xl shadow-lg max-w-full sm:max-w-[400px] w-full max-h-[90vh] overflow-y-auto flex flex-col items-center relative p-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="text-yellow-400 text-center font-bold text-xs sm:text-sm w-full mb-2 mt-4 px-2">
                ⚠️ Do not close this modal or navigate away until the process is complete.
              </div>
              {/* Close button only when successful */}
              {progressStep === 6 && !progressError && (
                <button
                  className="absolute top-2 right-3 text-gray-400 hover:text-white text-2xl font-bold focus:outline-none"
                  onClick={() => setShowProgressModal(false)}
                  aria-label="Close"
                  type="button"
                >
                  ×
                </button>
              )}
              <div className="w-full px-2 sm:px-6 pt-6 pb-2 flex flex-col items-center">
                <h2 className="text-base sm:text-lg font-bold text-white mb-2 tracking-wide">
                  {progressStep === 0 ? 'Review Launch Fees' : 'Launching Collection'}
                </h2>
                
                {/* Fee Review Step */}
                {progressStep === 0 && (
                  <div className="w-full">
                    <div className="text-green-200 font-semibold mb-4">To launch your collection, you will need to pay:</div>
                    <div className="bg-[#222] border border-[#32CD32] rounded-xl p-4 mb-4">
              <div className="text-green-100 text-base">
                <div className="flex justify-between mb-2">
                  <span>Launch Fee:</span>
                  <span className="font-bold text-yellow-300">3 PEPU</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Platform Fee (5%):</span>
                  <span className="font-bold text-yellow-300">
                    {(() => {
                      const maxSupply = extractedPairs.length;
                      const mintPrice = Number(allPrice);
                      const platformFee = (maxSupply > 0 && mintPrice > 0) ? (maxSupply * mintPrice * 500) / 10000 : 0;
                      return `${platformFee.toLocaleString()} PEPU`;
                    })()}
                  </span>
                </div>
                <div className="border-t border-[#32CD32] pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-white">Total:</span>
                    <span className="font-bold text-yellow-300">{calculatedFee} PEPU</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mb-4">
              This fee will be deducted from your wallet when you approve the transaction.<br/>
              {checkingBalance && <span>Checking wallet balance...</span>}
              {!checkingBalance && walletBalance !== null && (
                <span>
                  Your balance: {ethers.formatEther(walletBalance)} PEPU<br/>
                  {hasEnoughBalance ? (
                    <span className="text-green-400">You have enough to cover the fee.</span>
                  ) : (
                    <span className="text-red-400 font-bold">Insufficient balance to cover the total fee.</span>
                  )}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setLaunching(false);
                }}
                className="flex-1 px-4 py-2 bg-[#333] text-white font-bold rounded-full border-2 border-[#333] hover:bg-[#444] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setFeeApproved(true);
                  setProgressStep(1);
                  startLaunchProcess();
                }}
                className="flex-1 px-4 py-2 bg-yellow-400 text-black font-bold rounded-full border-2 border-yellow-400 hover:bg-yellow-300 transition-colors"
                disabled={!hasEnoughBalance || checkingBalance || !isConnected}
              >
                Approve & Continue
              </button>
            </div>
            {!isConnected && (
              <div className="text-red-400 font-bold mt-2">Please connect your wallet to continue.</div>
            )}
          </div>
                )}

                {/* Progress Steps */}
                {progressStep > 0 && (
                  <>
                    <div className="w-full bg-[#222] rounded-full h-1.5 mb-4">
                      <div
                        className="bg-[#32CD32] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${((progressStep) / 6) * 100}%` }}
                      ></div>
        </div>
                    <div className="w-full mb-4">
                      <div className="text-center text-white font-semibold mb-2">{progressMessage}</div>
                      {progressError && (
                        <div className="text-red-400 font-semibold mt-2 text-center w-full text-xs sm:text-sm">{progressError}</div>
                      )}
                    </div>
                  </>
                )}

                {/* Final Results */}
                {!progressError && progressStep === 6 && launchResult && (
                  <>
                    <div className="w-full border-t border-[#32CD32] my-2"></div>
                    <div className="w-full px-2 sm:px-6 pb-6 flex flex-col gap-4 items-start">
                      <div className="text-green-400 font-semibold mb-1 text-sm sm:text-base">Launch Successful!</div>
                      {collectionName && (
                        <div className="text-lg font-bold text-yellow-300">{collectionName}</div>
                      )}
                      {vanityUrl && (
                        <a
                          href={`https://lilipad.art/collection/${vanityUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-300 underline font-semibold text-base"
                        >
                          View Collection
                        </a>
                      )}
                      {launchResult.collectionAddress && (
                        <div className="w-full bg-[#232323] rounded p-3 flex flex-col gap-2 border border-[#32CD32]">
                          <div className="text-xs text-[#32CD32] font-semibold mb-1">Collection Contract Address</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs break-all text-white">{launchResult.collectionAddress}</span>
                            <button className="ml-1 text-xs text-[#32CD32] underline" onClick={() => navigator.clipboard.writeText(launchResult.collectionAddress || '')}>Copy</button>
                          </div>
                        </div>
                      )}
                      {launchResult.collectionURL && (
                        <div className="w-full bg-[#232323] rounded p-3 flex flex-col gap-2 border border-[#FFD700]">
                          <div className="text-xs text-[#FFD700] font-semibold mb-1">Collection URL</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs break-all text-white">{launchResult.collectionURL}</span>
                            <a
                              href={launchResult.collectionURL.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-xs text-[#FFD700] underline"
                            >
                              View
                            </a>
                            <button className="ml-1 text-xs text-[#FFD700] underline" onClick={() => navigator.clipboard.writeText(launchResult.collectionURL || '')}>Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
} 