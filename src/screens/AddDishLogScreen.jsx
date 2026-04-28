import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STAMPS } from '../utils/constants';
import { saveDishLog } from '../utils/storage';
import restaurants from '../data/restaurants';

export default function AddDishLogScreen() {
  const { restaurantId, dishId } = useParams();
  const navigate = useNavigate();
  const restaurant = restaurants.find((r) => r.id === restaurantId);
  const dish = restaurant?.dishes.find((d) => d.id === dishId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedStamps, setSelectedStamps] = useState([]);
  const [saving, setSaving] = useState(false);

  // Attachment state
  const [photos, setPhotos] = useState([]);
  const [voiceClips, setVoiceClips] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Photo handler
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos((prev) => [...prev, { name: file.name, data: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Voice handler
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (ev) => {
          setVoiceClips((prev) => [
            ...prev,
            { data: ev.target.result, duration: recordingTime },
          ]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const removeVoice = (index) => {
    setVoiceClips((prev) => prev.filter((_, i) => i !== index));
  };

  // Link handler
  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    setLinks((prev) => [...prev, url]);
    setLinkInput('');
    setShowLinkInput(false);
  };

  const removeLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSeconds = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!restaurant || !dish) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Not found</div>;
  }

  const toggleStamp = (id) => {
    setSelectedStamps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getRatingLabel = () => {
    if (rating === 0) return 'Tap to rate';
    if (rating <= 2) return 'Disappointing';
    if (rating <= 4) return 'Below Average';
    if (rating <= 5) return 'Average';
    if (rating <= 6) return 'Decent';
    if (rating <= 7) return 'Good';
    if (rating <= 8) return 'Great';
    if (rating <= 9) return 'Excellent';
    return 'Outstanding!';
  };

  const handleSave = async () => {
    if (rating === 0) {
      alert('Please rate the dish before saving.');
      return;
    }
    setSaving(true);
    await saveDishLog({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      dishId: dish.id,
      dishName: dish.name,
      dishCategory: dish.category,
      rating,
      comment,
      stamps: selectedStamps,
      photos,
      voiceClips,
      links,
    });
    navigate('/home');
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 style={styles.headerTitle}>Log Dish</h2>
        <div style={{ width: '40px' }} />
      </div>

      <div style={styles.body}>
        {/* Dish Header */}
        <div style={styles.dishHeader}>
          <h2 style={styles.dishName}>{dish.name}</h2>
          <p style={styles.restName}>at {restaurant.name}</p>
          <div style={styles.meta}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={styles.metaText}>{restaurant.location}</span>
            <span style={styles.metaDot}>{'\u2022'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={styles.metaText}>{today}</span>
          </div>
        </div>

        {/* Rating */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your Rating</h3>
          <div style={styles.ratingDisplay}>
            <span style={styles.ratingBig}>{rating || '-'}</span>
            <span style={styles.ratingOut}>/10</span>
          </div>
          <p style={styles.ratingLabel}>{getRatingLabel()}</p>
          <div style={styles.ratingDots}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                style={{
                  ...styles.dot,
                  background:
                    rating === n ? '#004225' : rating >= n ? 'rgba(0,66,37,0.2)' : '#F8F8F6',
                  color:
                    rating === n ? '#FFF' : rating >= n ? '#004225' : '#9E9E9E',
                }}
                onClick={() => setRating(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Stamps */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Stamps</h3>
          <p style={styles.sectionSub}>Tag your experience</p>
          <div style={styles.stampsGrid}>
            {STAMPS.map((stamp) => {
              const sel = selectedStamps.includes(stamp.id);
              return (
                <button
                  key={stamp.id}
                  style={{
                    ...styles.stampBtn,
                    background: sel ? stamp.color + '20' : '#F8F8F6',
                    border: sel ? `1.5px solid ${stamp.color}` : '1.5px solid transparent',
                    color: sel ? stamp.color : '#6B6B6B',
                  }}
                  onClick={() => toggleStamp(stamp.id)}
                >
                  <span style={{ marginRight: '6px' }}>{stamp.emoji}</span>
                  {stamp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Comments</h3>
          <p style={styles.sectionSub}>Your thoughts on this dish</p>
          <textarea
            style={styles.textarea}
            placeholder="How was the dish? What stood out? Would you order it again?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Attachments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Attachments</h3>

          {/* Photo */}
          <div style={styles.attachSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
            <button style={styles.attachTrigger} onClick={() => fileInputRef.current.click()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={styles.attachTriggerText}>Add Photo</span>
            </button>
            {photos.length > 0 && (
              <div style={styles.photoGrid}>
                {photos.map((photo, i) => (
                  <div key={i} style={styles.photoThumb}>
                    <img src={photo.data} alt={photo.name} style={styles.photoImg} />
                    <button style={styles.removeBtn} onClick={() => removePhoto(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voice */}
          <div style={styles.attachSection}>
            {isRecording ? (
              <button style={{ ...styles.attachTrigger, background: '#C0392B10', borderColor: '#C0392B' }} onClick={stopRecording}>
                <div style={styles.recordingDot} />
                <span style={{ ...styles.attachTriggerText, color: '#C0392B' }}>
                  Recording {formatSeconds(recordingTime)} — Tap to Stop
                </span>
              </button>
            ) : (
              <button style={styles.attachTrigger} onClick={startRecording}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <span style={styles.attachTriggerText}>Record Voice Note</span>
              </button>
            )}
            {voiceClips.length > 0 && (
              <div style={styles.clipList}>
                {voiceClips.map((clip, i) => (
                  <div key={i} style={styles.clipRow}>
                    <audio controls src={clip.data} style={styles.audioPlayer} />
                    <button style={styles.clipRemove} onClick={() => removeVoice(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link */}
          <div style={styles.attachSection}>
            {showLinkInput ? (
              <div style={styles.linkInputRow}>
                <input
                  style={styles.linkInput}
                  placeholder="Paste a URL..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  autoFocus
                />
                <button style={styles.linkAddBtn} onClick={addLink}>Add</button>
                <button style={styles.linkCancelBtn} onClick={() => { setShowLinkInput(false); setLinkInput(''); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button style={styles.attachTrigger} onClick={() => setShowLinkInput(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                <span style={styles.attachTriggerText}>Add Link</span>
              </button>
            )}
            {links.length > 0 && (
              <div style={styles.clipList}>
                {links.map((url, i) => (
                  <div key={i} style={styles.linkRow}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#004225" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                    <span style={styles.linkText}>{url}</span>
                    <button style={styles.clipRemove} onClick={() => removeLink(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          style={{
            ...styles.saveBtn,
            opacity: rating === 0 || saving ? 0.5 : 1,
          }}
          onClick={handleSave}
          disabled={rating === 0 || saving}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <path d="M22 4L12 14.01l-3-3"/>
          </svg>
          <span style={{ marginLeft: '8px' }}>{saving ? 'Saving...' : 'Save to Journal'}</span>
        </button>

        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#F8F8F6',
  },
  header: {
    background: '#004225',
    padding: '50px 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFF',
    margin: 0,
  },
  body: {
    flex: 1,
    overflow: 'auto',
  },
  dishHeader: {
    background: '#FFF',
    padding: '24px',
    textAlign: 'center',
    borderBottom: '1px solid #F8F8F6',
  },
  dishName: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#1A1A1A',
    margin: 0,
  },
  restName: {
    fontSize: '16px',
    color: '#6B6B6B',
    marginTop: '4px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    marginTop: '10px',
  },
  metaText: {
    fontSize: '13px',
    color: '#6B6B6B',
  },
  metaDot: {
    color: '#9E9E9E',
    margin: '0 4px',
  },
  section: {
    background: '#FFF',
    marginTop: '10px',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#1A1A1A',
    margin: 0,
  },
  sectionSub: {
    fontSize: '13px',
    color: '#6B6B6B',
    marginTop: '2px',
    marginBottom: '12px',
  },
  ratingDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: '16px',
  },
  ratingBig: {
    fontSize: '64px',
    fontWeight: 800,
    color: '#004225',
  },
  ratingOut: {
    fontSize: '24px',
    color: '#9E9E9E',
    marginLeft: '4px',
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: 600,
    color: '#6B6B6B',
    marginTop: '4px',
    marginBottom: '20px',
  },
  ratingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  dot: {
    width: '38px',
    height: '38px',
    borderRadius: '19px',
    border: 'none',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  stampsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stampBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  textarea: {
    width: '100%',
    background: '#F8F8F6',
    borderRadius: '14px',
    border: 'none',
    padding: '16px',
    fontSize: '15px',
    color: '#1A1A1A',
    minHeight: '120px',
    lineHeight: '22px',
    resize: 'none',
    boxSizing: 'border-box',
  },
  attachSection: {
    marginTop: '12px',
  },
  attachTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 16px',
    background: '#F8F8F6',
    border: '1.5px dashed #D0D0D0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  attachTriggerText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#004225',
  },
  photoGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  photoThumb: {
    position: 'relative',
    width: '80px',
    height: '80px',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '22px',
    height: '22px',
    borderRadius: '11px',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  recordingDot: {
    width: '10px',
    height: '10px',
    borderRadius: '5px',
    background: '#C0392B',
    animation: 'pulse 1s infinite',
  },
  clipList: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  clipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#F8F8F6',
    borderRadius: '10px',
    padding: '8px 12px',
  },
  audioPlayer: {
    flex: 1,
    height: '36px',
  },
  clipRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkInputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    padding: '12px 14px',
    background: '#F8F8F6',
    border: '1.5px solid #D0D0D0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#1A1A1A',
    outline: 'none',
  },
  linkAddBtn: {
    padding: '12px 18px',
    background: '#004225',
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  linkCancelBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#F8F8F6',
    borderRadius: '10px',
    padding: '10px 12px',
  },
  linkText: {
    flex: 1,
    fontSize: '13px',
    color: '#004225',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#004225',
    border: 'none',
    margin: '20px 20px 0',
    padding: '18px',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: 700,
    color: '#FFF',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'opacity 0.2s',
  },
};
