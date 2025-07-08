import React from "react";

export default function CreateCollectionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
      <h1 className="text-4xl font-bold mb-6" style={{ color: '#32CD32' }}>Create a New Collection</h1>
      <div className="w-full max-w-md bg-[#111] rounded-lg shadow-lg p-8 border-2" style={{ borderColor: '#32CD32' }}>
        <form className="flex flex-col gap-4">
          <label className="font-semibold">Collection Name
            <input type="text" className="mt-1 w-full px-3 py-2 rounded bg-black text-white border border-[#32CD32] focus:outline-none" placeholder="e.g. Frogs United" />
          </label>
          <label className="font-semibold">Description
            <textarea className="mt-1 w-full px-3 py-2 rounded bg-black text-white border border-[#32CD32] focus:outline-none" rows={3} placeholder="Describe your collection..." />
          </label>
          <label className="font-semibold">Logo/Image
            <input type="file" className="mt-1 w-full text-white" />
          </label>
          <label className="font-semibold">Creator Name
            <input type="text" className="mt-1 w-full px-3 py-2 rounded bg-black text-white border border-[#32CD32] focus:outline-none" placeholder="Your name or team" />
          </label>
          <button type="submit" className="mt-4 bg-[#32CD32] text-black font-bold py-2 px-4 rounded hover:bg-[#28a428] transition-colors">Create Collection</button>
        </form>
      </div>
    </div>
  );
} 