'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function SpotifyTrackPicker({ value, onChange, storageKey, label }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('');

  const selectTrack = (track) => {
    onChange(track);
    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(track));
    }
    setResults([]);
    setStatus('SELECTED');
  };

  const search = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;
    setStatus('SEARCHING SPOTIFY…');
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(cleanQuery)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Spotify search failed');
      setResults(Array.isArray(payload.tracks) ? payload.tracks : []);
      setStatus(payload.tracks?.length ? '' : 'NO TRACKS FOUND');
    } catch (error) {
      setResults([]);
      setStatus(error.message || 'SPOTIFY SEARCH UNAVAILABLE');
    }
  };

  return (
    <div className="spotify-track-picker">
      {value?.id ? (
        <a className="spotify-track-selected" href={value.spotifyUrl} target="_blank" rel="noreferrer">
          {value.image ? <Image src={value.image} alt={`${value.album} cover`} width={96} height={96} unoptimized /> : <span className="spotify-track-placeholder">♫</span>}
          <span><strong>{value.name}</strong><small>{value.artist}</small><small>{value.album}</small><em>OPEN IN SPOTIFY</em></span>
        </a>
      ) : <p>NO {label} SELECTED</p>}
      <div className="spotify-track-search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} placeholder="SEARCH SONG OR ARTIST" aria-label={`Search Spotify for ${label}`} />
        <button type="button" onClick={() => void search()}>SEARCH</button>
      </div>
      {status ? <p className="spotify-track-status" role="status">{status}</p> : null}
      {results.length ? <div className="spotify-track-results">{results.map((track) => <button type="button" key={track.id} onClick={() => selectTrack(track)}>{track.image ? <Image src={track.image} alt="" width={58} height={58} unoptimized /> : null}<span><strong>{track.name}</strong><small>{track.artist}</small></span></button>)}</div> : null}
      <small className="spotify-attribution">SEARCH RESULTS AND ARTWORK PROVIDED BY SPOTIFY</small>
    </div>
  );
}
