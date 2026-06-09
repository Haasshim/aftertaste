import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { STAMPS } from '../utils/constants';
import { saveDishLog } from '../lib/dataClient';
import { getRestaurant } from '../lib/places';
import Icon from '../components/Icon';
import RatingInput, { computeOverall } from '../components/RatingInput';
import Spinner, { FullScreenSpinner } from '../components/Spinner';
import OfflineBanner from '../components/OfflineBanner';
import { colors, radius, shadow, space } from '../theme/theme';

export default function AddDishLogScreen() {
  const { restaurantId, dishId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState(null);
  const [resolving, setResolving] = useState(true);

  // A dish from the restaurant's menu, or a custom dish typed by the user
  // (dishId === 'custom', name carried in the ?name= query param). Custom is the
  // only path for restaurants discovered via Places, which have no menu.
  const menuDish = restaurant?.dishes?.find((d) => d.id === dishId);
  const customName = (searchParams.get('name') || '').trim();
  const dish =
    menuDish ||
    (dishId === 'custom' && customName
      ? { id: `custom-${customName.toLowerCase().replace(/\s+/g, '-')}`, name: customName, category: null }
      : null);

  useEffect(() => {
    let active = true;
    getRestaurant(restaurantId)
      .then((r) => { if (active) setRestaurant(r); })
      .finally(() => { if (active) setResolving(false); });
    return () => { active = false; };
  }, [restaurantId]);

  const [facets, setFacets] = useState({});
  const [comment, setComment] = useState('');
  const [selectedStamps, setSelectedStamps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [photos, setPhotos] = useState([]);
  const [voiceClips, setVoiceClips] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkInput, setLinkInput] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micError, setMicError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos((prev) => [...prev, { name: file.name, data: ev.target.result }]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const startRecording = async () => {
    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (ev) =>
          setVoiceClips((prev) => [...prev, { data: ev.target.result, duration: recordingTime }]);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecordingTime(0);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch {
      setMicError('Microphone access is required to record voice notes. Please allow it in your settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const removeVoice = (index) => setVoiceClips((prev) => prev.filter((_, i) => i !== index));

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    setLinks((prev) => [...prev, url]);
    setLinkInput('');
    setShowLinkInput(false);
  };

  const removeLink = (index) => setLinks((prev) => prev.filter((_, i) => i !== index));

  const formatSeconds = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (resolving) {
    return <FullScreenSpinner label="Loading dish..." />;
  }
  if (!restaurant || !dish) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Not found</div>;
  }

  const toggleStamp = (id) =>
    setSelectedStamps((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const overall = computeOverall(facets);

  const handleSave = async () => {
    if (overall == null) {
      setFormError('Rate at least one aspect of the dish before saving.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await saveDishLog({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        dishId: dish.id,
        dishName: dish.name,
        dishCategory: dish.category,
        taste: facets.taste,
        ambience: facets.ambience,
        service: facets.service,
        overall,
        comment,
        stamps: selectedStamps,
        photos,
        voiceClips,
        links,
      });
      navigate('/home');
    } catch (e) {
      setFormError(e?.message || 'Could not save your log. Please try again.');
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.iconBtn} aria-label="Go back" onClick={() => navigate(-1)}>
          <Icon name="back" size={24} color={colors.white} />
        </button>
        <h2 style={styles.headerTitle}>Log Dish</h2>
        <div style={{ width: '40px' }} />
      </div>

      <OfflineBanner />

      <div style={styles.body}>
        <div style={styles.dishHeader}>
          <h2 style={styles.dishName}>{dish.name}</h2>
          <p style={styles.restName}>at {restaurant.name}</p>
          <div style={styles.meta}>
            <Icon name="map-pin" size={14} color={colors.gray} />
            <span style={styles.metaText}>{restaurant.location}</span>
            <span style={styles.metaDot}>{'•'}</span>
            <Icon name="calendar" size={14} color={colors.gray} />
            <span style={styles.metaText}>{today}</span>
          </div>
        </div>

        {/* Rating */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your Rating</h3>
          <p style={styles.sectionSub}>Rate each aspect — the overall is the average</p>
          <div style={{ marginTop: '12px' }}>
            <RatingInput value={facets} onChange={(f) => { setFacets(f); setFormError(''); }} />
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
                  aria-pressed={sel}
                  style={{
                    ...styles.stampBtn,
                    background: sel ? stamp.color + '20' : colors.offWhite,
                    border: sel ? `1.5px solid ${stamp.color}` : '1.5px solid transparent',
                    color: sel ? stamp.color : colors.gray,
                  }}
                  onClick={() => toggleStamp(stamp.id)}
                >
                  <Icon name={stamp.icon} size={15} color={sel ? stamp.color : colors.gray} />
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
            maxLength={5000}
          />
        </div>

        {/* Attachments */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Attachments</h3>

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
              <Icon name="camera" size={20} color={colors.brg} />
              <span style={styles.attachTriggerText}>Add Photo</span>
            </button>
            {photos.length > 0 && (
              <div style={styles.photoGrid}>
                {photos.map((photo, i) => (
                  <div key={i} style={styles.photoThumb}>
                    <img src={photo.data} alt={photo.name} style={styles.photoImg} />
                    <button style={styles.removeBtn} aria-label="Remove photo" onClick={() => removePhoto(i)}>
                      <Icon name="x" size={14} color={colors.white} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.attachSection}>
            {isRecording ? (
              <button
                style={{ ...styles.attachTrigger, background: colors.red + '10', borderColor: colors.red }}
                onClick={stopRecording}
              >
                <div style={styles.recordingDot} />
                <span style={{ ...styles.attachTriggerText, color: colors.red }}>
                  Recording {formatSeconds(recordingTime)} — Tap to Stop
                </span>
              </button>
            ) : (
              <button style={styles.attachTrigger} onClick={startRecording}>
                <Icon name="mic" size={20} color={colors.brg} />
                <span style={styles.attachTriggerText}>Record Voice Note</span>
              </button>
            )}
            {micError && <p style={styles.inlineError}>{micError}</p>}
            {voiceClips.length > 0 && (
              <div style={styles.clipList}>
                {voiceClips.map((clip, i) => (
                  <div key={i} style={styles.clipRow}>
                    <audio controls src={clip.data} style={styles.audioPlayer} />
                    <button style={styles.clipRemove} aria-label="Remove voice note" onClick={() => removeVoice(i)}>
                      <Icon name="x" size={14} color={colors.red} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                <button
                  style={styles.clipRemove}
                  aria-label="Cancel"
                  onClick={() => { setShowLinkInput(false); setLinkInput(''); }}
                >
                  <Icon name="x" size={16} color={colors.mediumGray} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button style={styles.attachTrigger} onClick={() => setShowLinkInput(true)}>
                <Icon name="link" size={20} color={colors.brg} />
                <span style={styles.attachTriggerText}>Add Link</span>
              </button>
            )}
            {links.length > 0 && (
              <div style={styles.clipList}>
                {links.map((url, i) => (
                  <div key={i} style={styles.linkRow}>
                    <Icon name="link" size={14} color={colors.brg} />
                    <span style={styles.linkText}>{url}</span>
                    <button style={styles.clipRemove} aria-label="Remove link" onClick={() => removeLink(i)}>
                      <Icon name="x" size={14} color={colors.red} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {formError && <p style={{ ...styles.inlineError, margin: '16px 20px 0' }}>{formError}</p>}

        <button
          style={{ ...styles.saveBtn, opacity: overall == null || saving ? 0.5 : 1 }}
          onClick={handleSave}
          disabled={overall == null || saving}
        >
          {saving ? (
            <Spinner size={20} color={colors.white} />
          ) : (
            <Icon name="check-circle" size={22} color={colors.white} strokeWidth={2.5} />
          )}
          <span>{saving ? 'Saving...' : 'Save to Journal'}</span>
        </button>

        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
}

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: colors.offWhite },
  header: {
    background: colors.brg,
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  },
  headerTitle: { fontSize: '18px', fontWeight: 700, color: colors.white, margin: 0 },
  body: { flex: 1, overflow: 'auto' },
  dishHeader: { background: colors.white, padding: '24px', textAlign: 'center', borderBottom: `1px solid ${colors.offWhite}` },
  dishName: { fontSize: '26px', fontWeight: 800, color: colors.dark, margin: 0 },
  restName: { fontSize: '16px', color: colors.gray, marginTop: '4px' },
  meta: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '10px' },
  metaText: { fontSize: '13px', color: colors.gray },
  metaDot: { color: colors.mediumGray, margin: '0 4px' },
  section: { background: colors.white, marginTop: '10px', padding: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: 700, color: colors.dark, margin: 0 },
  sectionSub: { fontSize: '13px', color: colors.gray, marginTop: '2px' },
  stampsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
  stampBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 12px',
    borderRadius: radius.md,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    background: colors.offWhite,
    borderRadius: '14px',
    border: 'none',
    padding: '16px',
    fontSize: '15px',
    color: colors.dark,
    minHeight: '120px',
    lineHeight: '22px',
    resize: 'none',
    boxSizing: 'border-box',
    marginTop: '12px',
  },
  attachSection: { marginTop: '12px' },
  attachTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '14px 16px',
    background: colors.offWhite,
    border: '1.5px dashed #D0D0D0',
    borderRadius: radius.md,
    cursor: 'pointer',
  },
  attachTriggerText: { fontSize: '14px', fontWeight: 600, color: colors.brg },
  photoGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
  photoThumb: { position: 'relative', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%', objectFit: 'cover' },
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
  recordingDot: { width: '10px', height: '10px', borderRadius: '5px', background: colors.red, animation: 'pulse 1s infinite' },
  clipList: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  clipRow: { display: 'flex', alignItems: 'center', gap: '8px', background: colors.offWhite, borderRadius: '10px', padding: '8px 12px' },
  audioPlayer: { flex: 1, height: '36px' },
  clipRemove: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  linkInputRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  linkInput: {
    flex: 1,
    padding: '12px 14px',
    background: colors.offWhite,
    border: '1.5px solid #D0D0D0',
    borderRadius: '10px',
    fontSize: '14px',
    color: colors.dark,
    outline: 'none',
  },
  linkAddBtn: {
    padding: '12px 18px',
    background: colors.brg,
    color: colors.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  linkRow: { display: 'flex', alignItems: 'center', gap: '8px', background: colors.offWhite, borderRadius: '10px', padding: '10px 12px' },
  linkText: { flex: 1, fontSize: '13px', color: colors.brg, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  inlineError: { color: colors.red, fontSize: '14px', fontWeight: 500, marginTop: '8px' },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: colors.brg,
    border: 'none',
    margin: '20px 20px 0',
    padding: '18px',
    borderRadius: radius.lg,
    fontSize: '18px',
    fontWeight: 700,
    color: colors.white,
    cursor: 'pointer',
    boxShadow: shadow.raised,
  },
};
