'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Save, Image as ImageIcon, Type, BellRing, Upload, Music, Plus, Trash2, FolderPlus, BookOpen, Edit, PlusCircle, Tag, Calendar, Clock, HelpCircle, FileText, ChevronDown, X, Search, Filter, Folder, Check, Loader2, Volume2, File } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaFile {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  url: string;
  type: 'image' | 'audio' | 'other';
  folder: 'uploads' | 'audio' | 'encyclopedia';
  size: number;
}

interface Track {
  id: string;
  name: string;
  url: string;
}

interface ZenCategory {
  id: string;
  name: string;
  tracks: Track[];
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  slug: string;
  imageUrl?: string;
}

const defaultBlogs: BlogPost[] = [
  {
    id: "1",
    title: "چگونه با تکنیک مسدودسازی زمانی (Time Blocking) بهره‌وری خود را دوبرابر کنیم؟",
    excerpt: "مسدودسازی زمانی یکی از مؤثرترین روش‌ها برای سازماندهی روز و جلوگیری از حواس‌پرتی است. در این مقاله به چگونگی ادغام آن با تقویم سایبان می‌پردازیم.",
    content: `### تکنیک مسدودسازی زمانی (Time Blocking) چیست؟

مسدودسازی زمانی یکی از قدرتمندترین متدهای مدیریت زمان در دنیاست که توسط افراد موفقی همچون ایلان ماسک و کال نیوپورت استفاده می‌شود. در این روش، شما به جای نوشتن یک لیست بی‌پایان از کارها، روز خود را به بلوک‌های زمانی مشخص تقسیم می‌کنید و به هر بلوک، وظیفه خاصی را اختصاص می‌دهید.

#### چرا لیست کارهای سنتی کارایی ندارد؟
لیست کارهای ساده معمولاً فاقد فاکتور «زمان» هستند. وقتی زمان انجام کارها مشخص نباشد، مغز تمایل دارد کارهای ساده‌تر را انتخاب کند و کارهای عمیق و مهم‌تر را به تعویق بیندازد. مسدودسازی زمانی این مشکل را با مجبور کردن شما به برنامه‌ریزی دقیق حل می‌کند.

#### مراحل پیاده‌سازی مسدودسازی زمانی با سایبان:
۱. **شناسایی اولویت‌های روزانه:** قبل از شروع روز، ۳ کار اصلی خود را مشخص کنید.
۲. **تخصیص بلوک‌های زمانی:** در تقویم سایبان، برای هر کار یک بازه زمانی مشخص (مثلا ۹:۰۰ تا ۱۰:۳۰ برای کار عمیق) ایجاد کنید.
۳. **بلوک‌های واکنش‌گرایانه:** زمان‌هایی را برای پاسخ به ایمیل‌ها، پیام‌ها و کارهای پیش‌بینی نشده در نظر بگیرید تا برنامه اصلی شما بهم نخورد.
۴. **تمرکز مطلق:** در حین اجرای هر بلوک، تمامی اعلان‌ها را خاموش کرده و از پخش‌کننده موسیقی ذن سایبان برای تمرکز بیشتر استفاده کنید.

با رعایت این اصول ساده، تمرکز ذهنی شما افزایش یافته و بهره‌وری روزانه‌تان به شکل چشمگیری ارتقا می‌یابد.`,
    category: "بهره‌وری",
    tags: ["تمرکز", "مدیریت زمان", "آموزش"],
    date: "۱۴۰۵/۰۳/۲۵",
    readTime: "۵ دقیقه",
    slug: "time-blocking-guide",
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop"
  },
  {
    id: "2",
    title: "تاثیر پایش منظم مصرف آب و خواب بر تمرکز ذهنی برنامه‌نویسان و طراحان",
    excerpt: "کم‌آبی بدن و خواب نامنظم تأثیر مخرب مستقیمی روی کورتکس پیش‌پیشانی دارد. یاد بگیرید چگونه با ردیاب سلامت سایبان عادات بیولوژیک خود را بهینه‌سازی کنید.",
    content: `### رابطه بین بیولوژی و بهره‌وری ذهنی

عملکرد کورتکس پیش‌پیشانی مغز (ناحیه‌ای که مسئول تصمیم‌گیری، تمرکز عمیق و حل مسئله است) به شدت به وضعیت هیدراتاسیون و خواب شما وابسته است. کاهش حتی ۲ درصد از آب بدن می‌تواند باعث کاهش ۲۰ درصدی سرعت پردازش شناختی مغز شود!

#### تاثیر کم‌آبی بر عملکرد کورتکس پیش‌پیشانی:
زمانی که آب کافی به مغز نمی‌رسد، حجم سلول‌های مغزی کاهش یافته و انتقال‌دهنده‌های عصبی با کندی مواجه می‌شوند. این امر منجر به ایجاد مه مغزی (Brain Fog)، خستگی زودرس و کاهش صبر در حل مسائل پیچیده می‌شود.

#### چرا پایش خواب اهمیت دارد؟
خواب عمیق (Deep Sleep) مرحله‌ای است که مغز اقدام به سم‌زدایی و یکپارچه‌سازی حافظه می‌کند. خواب ناکافی مانع از پاک‌سازی پروتئین‌های سمی مغز شده و تمرکز روز بعد را به شدت تضعیف می‌کند.

#### روش بهینه‌سازی بیولوژیک با سایبان:
* **پایش هوشمند آب:** برای خود هدف حداقل ۸ لیوان آب در روز تنظیم کرده و با هر لیوان، آن را در بخش سلامت سایبان ثبت کنید.
* **تنظیم ساعت خواب منظم:** خواب بین ۷ تا ۸ ساعت با کیفیت بالا را هدف قرار داده و کیفیت آن را هر روز ارزیابی کنید.
* **تحلیل روندها:** در پایان هفته، نمودارهای همبستگی بین مصرف آب، میزان خواب و خلق‌وخوی روزانه خود را بررسی کنید تا الگوی بهینه خود را بیابید.`,
    category: "پایگاه سلامت",
    tags: ["سلامت", "تغذیه", "سبک زندگی"],
    date: "۱۴۰۵/۰۳/۲۰",
    readTime: "۷ دقیقه",
    slug: "hydration-and-sleep-focus",
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "عادت‌سازی پیشرو: چطور زنجیره عادات روزانه (Habit Streaks) مغز را پاداش می‌دهد؟",
    excerpt: "سیستم دوپامین مغز عاشق تکمیل زنجیره‌های متوالی است. بررسی علمی نقش گیمیفیکیشن و زنجیره‌ها در تغییر رفتار بلندمدت خانواده و کارآفرینان.",
    content: `### علم پشت زنجیره عادات (Habit Streaks)

چرخه عادت در مغز شامل سه مرحله است: محرک، رفتار، و پاداش. زمانی که شما یک رفتار مثبت (مثل ورزش یا مطالعه) را انجام می‌دهید و آن را ثبت می‌کنید، مغز دوز کوچکی از انتقال‌دهنده عصبی دوپامین را ترشح می‌کند که حس رضایت‌مندی به همراه دارد.

#### قدرت زنجیره‌ها:
هنگامی که چندین روز متوالی یک کار را انجام می‌دهید، یک «زنجیره متوالی» شکل می‌گیرد. در این مرحله، انگیزه شما از «تمایل به انجام کار» به «ترس از شکستن زنجیره» تغییر می‌یابد. مغز شما تمایل شدیدی دارد تا این تسلسل بصری را حفظ کند.

#### چگونه عادات پایدار بسازیم؟
۱. **عادات را به بخش‌های بسیار کوچک تقسیم کنید:** به جای «۱ ساعت ورزش روزانه»، با «۱۰ دقیقه نرمش» شروع کنید.
۲. **بلافاصله ثبت کنید:** پس از انجام عادت، فوراً دکمه تکمیل را در بخش عادات سایبان بزنید تا پیوند عصبی بین رفتار و پاداش تقویت شود.
۳. **هرگز دو روز متوالی را از دست ندهید:** شکستن زنجیره برای یک روز طبیعی است، اما اگر دو روز متوالی تکرار شود، به معنای شروع یک عادت بد جدید است.

با استفاده از ابزار پایش عادات سایبان و کسب امتیاز تجربه (XP) برای هر موفقیت، مسیر عادت‌سازی خود را به یک بازی جذاب و علمی تبدیل کنید.`,
    category: "روانشناسی",
    tags: ["عادت‌ها", "گیمیفیکیشن", "انگیزه"],
    date: "۱۴۰۵/۰۳/۱۵",
    readTime: "۴ دقیقه",
    slug: "science-of-habit-streaks",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop"
  }
];

function getUniqueFileName(fileExt: string): string {
  return `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
}

function getAudioFileName(catId: string, trackId: string, fileExt: string): string {
  return `audio_${catId}_${trackId}_${Date.now()}.${fileExt}`;
}

export default function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Modals / inline prompt states to avoid iframe window.prompt / window.confirm issues
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const [newTrackName, setNewTrackName] = useState('');
  const [addingTrackCatId, setAddingTrackCatId] = useState<string | null>(null);

  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  
  // Encyclopedia Post Management states
  const [editingPostId, setEditingPostId] = useState<string | 'new' | null>(null);
  const [postForm, setPostForm] = useState<BlogPost>({
    id: '',
    title: '',
    excerpt: '',
    content: '',
    category: 'بهره‌وری',
    tags: [],
    date: '',
    readTime: '۵ دقیقه',
    slug: ''
  });
  const [tagInput, setTagInput] = useState('');
  const postCoverInputRef = useRef<HTMLInputElement>(null);

  const [landingConfig, setLandingConfig] = useState<any>({
    hero_bg: '',
    logo: '',
    zen_categories: [],
    encyclopedia_posts: []
  });
  
  const [announcements, setAnnouncements] = useState({
    show: false,
    text: '',
    type: 'info'
  });

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const supabase = createClient();

  // Media Gallery Modal states
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaAllowedType, setMediaAllowedType] = useState<'image' | 'audio' | 'all'>('all');
  const [mediaOnSelectCallback, setMediaOnSelectCallback] = useState<((url: string, name: string) => void) | null>(null);
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaFilterType, setMediaFilterType] = useState<'all' | 'image' | 'audio'>('all');
  const [mediaFilterFolder, setMediaFilterFolder] = useState<'all' | 'uploads' | 'audio' | 'encyclopedia'>('all');
  const [mediaSortBy, setMediaSortBy] = useState<'newest' | 'oldest' | 'size_desc' | 'size_asc'>('newest');
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const fetchMediaLibrary = async () => {
    setMediaLoading(true);
    try {
      const folders = [
        { name: 'uploads', path: 'uploads' },
        { name: 'audio', path: 'uploads/audio' },
        { name: 'encyclopedia', path: 'uploads/encyclopedia' }
      ] as const;

      let allFiles: MediaFile[] = [];

      for (const folder of folders) {
        const { data, error } = await supabase.storage.from('public').list(folder.path, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

        if (error) {
          console.error(`Error listing storage folder ${folder.path}:`, error);
          continue;
        }

        if (data) {
          // Filter out folders and placeholder empty files
          const filesOnly = data.filter(item => item.name !== '.emptyFolderPlaceholder' && item.metadata);
          
          const mapped = filesOnly.map(file => {
            const filePath = folder.path === 'uploads' ? `uploads/${file.name}` : `${folder.path}/${file.name}`;
            const { data: urlData } = supabase.storage.from('public').getPublicUrl(filePath);
            
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            let type: 'image' | 'audio' | 'other' = 'other';
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
              type = 'image';
            } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
              type = 'audio';
            }

            return {
              id: file.id || `${folder.name}_${file.name}`,
              name: file.name,
              updated_at: file.updated_at || file.created_at || new Date().toISOString(),
              created_at: file.created_at || new Date().toISOString(),
              url: urlData.publicUrl,
              type,
              folder: folder.name,
              size: file.metadata?.size || 0
            };
          });

          allFiles = [...allFiles, ...mapped];
        }
      }

      setMediaFiles(allFiles);
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    if (isMediaModalOpen) {
      fetchMediaLibrary();
      setSelectedMediaFile(null);
      setMediaSearch('');
      setMediaFilterFolder('all');
      setDeletingFileId(null);
    }
  }, [isMediaModalOpen]);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDeleteMediaFile = async (file: MediaFile) => {
    try {
      const filePath = file.folder === 'uploads' ? `uploads/${file.name}` : `uploads/${file.folder}/${file.name}`;
      const { error } = await supabase.storage.from('public').remove([filePath]);
      if (error) {
        setMessage(`خطا در حذف فایل: ${error.message}`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMediaFiles(prev => prev.filter(f => f.id !== file.id));
        if (selectedMediaFile?.id === file.id) {
          setSelectedMediaFile(null);
        }
        setDeletingFileId(null);
        setMessage('فایل با موفقیت از حافظه حذف شد.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setMessage(`خطا در حذف فایل: ${err.message || err}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const openMediaForHeroBg = () => {
    setMediaAllowedType('image');
    setMediaOnSelectCallback(() => (url: string) => {
      setLandingConfig((prev: any) => ({ ...prev, hero_bg: url }));
    });
    setIsMediaModalOpen(true);
  };

  const openMediaForLogo = () => {
    setMediaAllowedType('image');
    setMediaOnSelectCallback(() => (url: string) => {
      setLandingConfig((prev: any) => ({ ...prev, logo: url }));
    });
    setIsMediaModalOpen(true);
  };

  const openMediaForTrack = (catId: string, trackId: string) => {
    setMediaAllowedType('audio');
    setMediaOnSelectCallback(() => (url: string, filename: string) => {
      setLandingConfig((prev: any) => {
        const updatedCategories = prev.zen_categories.map((cat: any) => {
          if (cat.id === catId) {
            return {
              ...cat,
              tracks: cat.tracks.map((t: any) => {
                if (t.id === trackId) {
                  const cleanedName = filename.replace(/\.[^/.]+$/, "");
                  return { ...t, url, name: t.name || cleanedName };
                }
                return t;
              })
            };
          }
          return cat;
        });
        return {
          ...prev,
          zen_categories: updatedCategories
        };
      });
    });
    setIsMediaModalOpen(true);
  };

  const openMediaForPostCover = () => {
    setMediaAllowedType('image');
    setMediaOnSelectCallback(() => (url: string) => {
      setPostForm((prev: any) => ({ ...prev, imageUrl: url }));
    });
    setIsMediaModalOpen(true);
  };

  async function fetchContent() {
    setLoading(true);
    const { data: landingData } = await supabase.from('global_settings').select('value').eq('id', 'landing_page').single() as any;
    if (landingData?.value) {
      let categories = landingData.value.zen_categories;
      if (!categories) {
        // Fallback or migrate from old zen_tracks structure
        const oldTracks = landingData.value.zen_tracks || {};
        categories = [
          {
            id: 'deep_work',
            name: 'کار عمیق (Deep Work)',
            tracks: oldTracks.deep_work?.url ? [{ id: 'tr_1', name: oldTracks.deep_work.name || 'آهنگ کار عمیق', url: oldTracks.deep_work.url }] : []
          },
          {
            id: 'creativity',
            name: 'خلاقیت (Creativity)',
            tracks: oldTracks.creativity?.url ? [{ id: 'tr_2', name: oldTracks.creativity.name || 'آهنگ خلاقیت', url: oldTracks.creativity.url }] : []
          },
          {
            id: 'learning',
            name: 'یادگیری (Learning)',
            tracks: oldTracks.learning?.url ? [{ id: 'tr_3', name: oldTracks.learning.name || 'آهنگ یادگیری', url: oldTracks.learning.url }] : []
          },
          {
            id: 'chill',
            name: 'آرامش (Chill)',
            tracks: oldTracks.chill?.url ? [{ id: 'tr_4', name: oldTracks.chill.name || 'آهنگ آرامش', url: oldTracks.chill.url }] : []
          }
        ];
      }
      setLandingConfig({
        hero_bg: landingData.value.hero_bg || '',
        logo: landingData.value.logo || '',
        zen_categories: categories,
        encyclopedia_posts: landingData.value.encyclopedia_posts || defaultBlogs
      });
    } else {
      setLandingConfig({
        hero_bg: '',
        logo: '',
        zen_categories: [
          { id: 'deep_work', name: 'کار عمیق (Deep Work)', tracks: [] },
          { id: 'creativity', name: 'خلاقیت (Creativity)', tracks: [] },
          { id: 'learning', name: 'یادگیری (Learning)', tracks: [] },
          { id: 'chill', name: 'آرامش (Chill)', tracks: [] }
        ],
        encyclopedia_posts: defaultBlogs
      });
    }

    const { data: annData } = await supabase.from('global_settings').select('value').eq('id', 'announcements').single() as any;
    if (annData?.value) setAnnouncements(annData.value);
    
    setLoading(false);
  }

  useEffect(() => {
    fetchContent();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'hero_bg' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('در حال آپلود...');
    setSaving(true);
    
    const fileExt = file.name.split('.').pop() || '';
    const fileName = getUniqueFileName(fileExt);
    const filePath = `uploads/${fileName}`;

    const { error } = await supabase.storage.from('public').upload(filePath, file);
    
    if (error) {
      setMessage(`خطا در آپلود: ${error.message}`);
      setSaving(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(filePath);
    
    setLandingConfig((prev: any) => ({
      ...prev,
      [type]: publicUrlData.publicUrl
    }));
    
    setMessage('آپلود با موفقیت انجام شد. برای ذخیره روی دکمه به‌روزرسانی کلیک کنید.');
    setSaving(false);
  };

  const handleTrackUpload = async (event: React.ChangeEvent<HTMLInputElement>, catId: string, trackId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('در حال آپلود فایل صوتی...');
    setSaving(true);
    
    const fileExt = file.name.split('.').pop() || '';
    const fileName = getAudioFileName(catId, trackId, fileExt);
    const filePath = `uploads/audio/${fileName}`;

    const { error } = await supabase.storage.from('public').upload(filePath, file);
    
    if (error) {
      setMessage(`خطا در آپلود فایل صوتی: ${error.message}`);
      setSaving(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(filePath);
    
    setLandingConfig((prev: any) => {
      const updatedCategories = prev.zen_categories.map((cat: any) => {
        if (cat.id === catId) {
          return {
            ...cat,
            tracks: cat.tracks.map((t: any) => {
              if (t.id === trackId) {
                return { ...t, url: publicUrlData.publicUrl, name: t.name || file.name.replace(/\.[^/.]+$/, "") };
              }
              return t;
            })
          };
        }
        return cat;
      });
      return {
        ...prev,
        zen_categories: updatedCategories
      };
    });
    
    setMessage('آپلود صوتی با موفقیت انجام شد. برای ذخیره نهایی دکمه به‌روزرسانی را بزنید.');
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    const { error: err1 } = await (supabase.from('global_settings') as any).upsert({ id: 'landing_page', value: landingConfig });
    const { error: err2 } = await (supabase.from('global_settings') as any).upsert({ id: 'announcements', value: announcements });
    
    if (err1 || err2) {
      setMessage('خطا در ذخیره محتوا');
    } else {
      setMessage('محتوا با موفقیت به‌روز شد');
    }
    setSaving(false);
    
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">مدیریت محتوا</h1>
        <p className="text-sm text-slate-400 mt-1">ویرایش صفحات لندینگ و اعلان‌های سراسری</p>
      </header>

      {loading ? (
        <div className="text-slate-400">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Landing Page */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">صفحه لندینگ</h3>
                <p className="text-xs text-slate-400">تصاویر و متون صفحه اصلی</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">تصویر پس‌زمینه هیرو (URL یا آپلود)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={landingConfig.hero_bg}
                    onChange={(e) => setLandingConfig({...landingConfig, hero_bg: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-white focus:outline-none focus:border-purple-500 font-mono"
                    dir="ltr"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    ref={heroFileInputRef} 
                    onChange={(e) => handleFileUpload(e, 'hero_bg')}
                  />
                  <button 
                    type="button"
                    onClick={openMediaForHeroBg}
                    className="flex items-center justify-center gap-1.5 px-3 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 rounded-xl transition-colors border border-purple-900/50 cursor-pointer text-xs font-bold"
                    title="انتخاب از فایل‌های قبلی"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="hidden sm:inline">گالری رسانه</span>
                  </button>
                  <button 
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={saving}
                    className="flex items-center justify-center px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 cursor-pointer"
                    title="آپلود تصویر جدید"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
                {landingConfig.hero_bg && (
                  <div className="mt-3 h-32 rounded-xl overflow-hidden border border-slate-800 relative group">
                    <img src={landingConfig.hero_bg} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">لوگوی سایت (URL یا آپلود)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={landingConfig.logo}
                    onChange={(e) => setLandingConfig({...landingConfig, logo: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-white focus:outline-none focus:border-purple-500 font-mono"
                    dir="ltr"
                    placeholder="/logo.png"
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    ref={logoFileInputRef} 
                    onChange={(e) => handleFileUpload(e, 'logo')}
                  />
                  <button 
                    type="button"
                    onClick={openMediaForLogo}
                    className="flex items-center justify-center gap-1.5 px-3 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 rounded-xl transition-colors border border-purple-900/50 cursor-pointer text-xs font-bold"
                    title="انتخاب از فایل‌های قبلی"
                  >
                    <Folder className="w-4 h-4" />
                    <span className="hidden sm:inline">گالری رسانه</span>
                  </button>
                  <button 
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={saving}
                    className="flex items-center justify-center px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 cursor-pointer"
                    title="آپلود لوگوی جدید"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                </div>
                {landingConfig.logo && (
                  <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-center">
                    <img src={landingConfig.logo} alt="Preview Logo" className="h-16 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">اعلان‌های سراسری</h3>
                <p className="text-xs text-slate-400">نمایش پیام در بالای داشبورد کاربران</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="block text-sm font-medium text-white">نمایش اعلان فعال باشد</span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={announcements.show} onChange={(e) => setAnnouncements({...announcements, show: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">نوع اعلان</label>
                <select 
                  value={announcements.type}
                  onChange={(e) => setAnnouncements({...announcements, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-right text-white focus:outline-none focus:border-amber-500 appearance-none animate-fadeIn"
                >
                  <option value="info">اطلاع رسانی (آبی)</option>
                  <option value="success">موفقیت (سبز)</option>
                  <option value="warning">هشدار (زرد)</option>
                  <option value="error">مهم/خطا (قرمز)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Zen Music Tracks Dynamic Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 col-span-1 lg:col-span-2 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">مدیریت موزیک‌های اختصاصی تمرکز مطلق</h3>
                  <p className="text-xs text-slate-400">بخش‌های مختلف (مانند کار عمیق، خلاقیت، جنگل و غیره) بسازید و هر تعداد موزیک که خواستید آپلود کنید.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCat(true);
                  setNewCatName('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-teal-600/15 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>افزودن بخش جدید</span>
              </button>
            </div>

            <div className="space-y-6">
              {isAddingCat && (
                <div className="p-4 bg-slate-950 border border-teal-500/30 rounded-2xl mb-6 space-y-3" dir="rtl">
                  <h4 className="text-sm font-bold text-white">ایجاد بخش جدید</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="مثال: صدای جنگل، باران، کایزن عمیق..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCatName.trim()) {
                          const newCat = { id: `cat_${Date.now()}`, name: newCatName.trim(), tracks: [] };
                          setLandingConfig((prev: any) => ({
                            ...prev,
                            zen_categories: [...(prev.zen_categories || []), newCat]
                          }));
                          setNewCatName('');
                          setIsAddingCat(false);
                        }
                      }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      ثبت
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCatName('');
                        setIsAddingCat(false);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {(landingConfig.zen_categories || []).length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  هیچ بخش موسیقی ساخته نشده است. روی دکمه «افزودن بخش جدید» کلیک کنید.
                </div>
              ) : (
                (landingConfig.zen_categories || []).map((cat: any) => (
                  <div key={cat.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    {deletingCatId === cat.id ? (
                      <div className="space-y-3 p-2" dir="rtl">
                        <p className="text-sm font-bold text-rose-400">آیا از حذف کامل بخش «{cat.name}» و تمام موزیک‌های آن مطمئن هستید؟</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLandingConfig((prev: any) => ({
                                ...prev,
                                zen_categories: prev.zen_categories.filter((c: any) => c.id !== cat.id)
                              }));
                              setDeletingCatId(null);
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl cursor-pointer"
                          >
                            بله، حذف شود
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCatId(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                            <input
                              type="text"
                              value={cat.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLandingConfig((prev: any) => ({
                                  ...prev,
                                  zen_categories: prev.zen_categories.map((c: any) => c.id === cat.id ? { ...c, name: val } : c)
                                }));
                              }}
                              className="bg-transparent text-white font-black text-sm border-b border-transparent hover:border-slate-700 focus:border-teal-500 focus:outline-none px-1 py-0.5 transition-all w-48 sm:w-64 text-right"
                              placeholder="نام بخش..."
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setAddingTrackCatId(cat.id);
                                setNewTrackName('');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>افزودن موزیک</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingCatId(cat.id);
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="حذف کامل این بخش"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {addingTrackCatId === cat.id && (
                          <div className="p-4 bg-slate-900 border border-teal-500/20 rounded-xl space-y-3 animate-fadeIn" dir="rtl">
                            <h5 className="text-xs font-bold text-white">افزودن موزیک جدید به این بخش</h5>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newTrackName}
                                onChange={(e) => setNewTrackName(e.target.value)}
                                placeholder="نام آهنگ..."
                                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newTrackName.trim()) {
                                    const newTrack = { id: `tr_${Date.now()}`, name: newTrackName.trim(), url: '' };
                                    setLandingConfig((prev: any) => ({
                                      ...prev,
                                      zen_categories: prev.zen_categories.map((c: any) => {
                                        if (c.id === cat.id) {
                                          return { ...c, tracks: [...(c.tracks || []), newTrack] };
                                        }
                                        return c;
                                      })
                                    }));
                                    setNewTrackName('');
                                    setAddingTrackCatId(null);
                                  }
                                }}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                              >
                                ثبت
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewTrackName('');
                                  setAddingTrackCatId(null);
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(cat.tracks || []).length === 0 ? (
                            <div className="col-span-full text-center py-4 text-xs text-slate-600 font-bold">
                              آهنگی در این بخش وجود ندارد.
                            </div>
                          ) : (
                            (cat.tracks || []).map((track: any) => (
                              <div key={track.id} className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <input
                                    type="text"
                                    value={track.name}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLandingConfig((prev: any) => ({
                                        ...prev,
                                        zen_categories: prev.zen_categories.map((c: any) => {
                                          if (c.id === cat.id) {
                                            return {
                                              ...c,
                                              tracks: c.tracks.map((t: any) => t.id === track.id ? { ...t, name: val } : t)
                                            };
                                          }
                                          return c;
                                        })
                                      }));
                                    }}
                                    className="bg-transparent text-xs font-bold text-slate-200 border-b border-transparent hover:border-slate-800 focus:border-teal-500 focus:outline-none px-1 py-0.5 transition-all w-full text-right"
                                    placeholder="نام آهنگ..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLandingConfig((prev: any) => ({
                                        ...prev,
                                        zen_categories: prev.zen_categories.map((c: any) => {
                                          if (c.id === cat.id) {
                                            return { ...c, tracks: c.tracks.filter((t: any) => t.id !== track.id) };
                                          }
                                          return c;
                                        })
                                      }));
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    title="حذف آهنگ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={track.url}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setLandingConfig((prev: any) => ({
                                        ...prev,
                                        zen_categories: prev.zen_categories.map((c: any) => {
                                          if (c.id === cat.id) {
                                            return {
                                              ...c,
                                              tracks: c.tracks.map((t: any) => t.id === track.id ? { ...t, url: val } : t)
                                            };
                                          }
                                          return c;
                                        })
                                      }));
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-left text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                                    dir="ltr"
                                    placeholder="https://..."
                                  />
                                  <input 
                                    type="file" 
                                    accept="audio/*"
                                    className="hidden" 
                                    ref={(el) => {
                                      fileInputRefs.current[`${cat.id}_${track.id}`] = el;
                                    }} 
                                    onChange={(e) => handleTrackUpload(e, cat.id, track.id)}
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => openMediaForTrack(cat.id, track.id)}
                                    className="flex items-center justify-center gap-1 px-2.5 bg-teal-950/40 hover:bg-teal-900/40 text-teal-300 hover:text-teal-200 rounded-lg transition-colors border border-teal-900/50 cursor-pointer text-[10px] font-bold"
                                    title="انتخاب از موزیک‌های قبلی"
                                  >
                                    <Folder className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">آرشیو</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      fileInputRefs.current[`${cat.id}_${track.id}`]?.click();
                                    }}
                                    disabled={saving}
                                    className="flex items-center justify-center px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                                    title="آپلود فایل صوتی جدید"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {track.url && (
                                  <div className="pt-1">
                                    <audio src={track.url} controls className="w-full h-7 opacity-75" />
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Encyclopedia Post Management */}
      {!loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 col-span-1 lg:col-span-2 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">مدیریت دانشنامه سلامت و بهره‌وری (مقالات علمی)</h3>
                <p className="text-xs text-slate-400">مقالات دانشنامه صفحه لندینگ را مدیریت کنید. می‌توانید مقاله جدید اضافه کنید یا مقالات فعلی را ویرایش یا حذف نمایید.</p>
              </div>
            </div>
            
            {editingPostId === null && (
              <button
                type="button"
                onClick={() => {
                  setEditingPostId('new');
                  setPostForm({
                    id: '',
                    title: '',
                    excerpt: '',
                    content: '',
                    category: 'بهره‌وری',
                    tags: [],
                    date: '',
                    readTime: '۵ دقیقه',
                    slug: ''
                  });
                  setTagInput('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>افزودن مقاله جدید</span>
              </button>
            )}
          </div>

          {editingPostId !== null ? (
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-6 animate-fadeIn" dir="rtl">
              <h4 className="text-md font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                {editingPostId === 'new' ? 'افزودن مقاله جدید به دانشنامه' : 'ویرایش مقاله دانشنامه'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">عنوان مقاله</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="مثال: چگونه با تغذیه مناسب خستگی کاری را مهار کنیم؟"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">دسته‌بندی</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="بهره‌وری">بهره‌وری</option>
                      <option value="پایگاه سلامت">پایگاه سلامت</option>
                      <option value="روانشناسی">روانشناسی</option>
                      <option value="تغذیه">تغذیه</option>
                      <option value="سبک زندگی">سبک زندگی</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">زمان تقریبی مطالعه</label>
                    <input
                      type="text"
                      value={postForm.readTime}
                      onChange={(e) => setPostForm({ ...postForm, readTime: e.target.value })}
                      placeholder="مثال: ۵ دقیقه"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-bold text-slate-300">خلاصه کوتاه مقاله (برای پیش‌نمایش کارت)</label>
                  <textarea
                    rows={2}
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                    placeholder="خلاصه‌ای جذاب و کوتاه برای نمایش در لیست مقالات لندینگ بنویسید..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-bold text-slate-300">تصویر شاخص مقاله</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postForm.imageUrl || ''}
                      onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                      placeholder="آدرس اینترنتی تصویر یا از دکمه آپلود استفاده کنید"
                      className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      dir="ltr"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={postCoverInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setMessage('در حال آپلود تصویر مقاله...');
                        const fileExt = file.name.split('.').pop() || '';
                        const fileName = getUniqueFileName(fileExt);
                        const filePath = `uploads/encyclopedia/${fileName}`;
                        const { error } = await supabase.storage.from('public').upload(filePath, file);
                        if (error) {
                          setMessage(`خطا در آپلود: ${error.message}`);
                          return;
                        }
                        const { data: publicUrlData } = supabase.storage.from('public').getPublicUrl(filePath);
                        setPostForm(prev => ({ ...prev, imageUrl: publicUrlData.publicUrl }));
                        setMessage('تصویر مقاله با موفقیت آپلود شد.');
                        setTimeout(() => setMessage(''), 3000);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={openMediaForPostCover}
                      className="px-3 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 rounded-xl transition-colors border border-purple-900/50 flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="انتخاب از تصاویر قبلی"
                    >
                      <Folder className="w-4 h-4" />
                      <span>گالری رسانه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => postCoverInputRef.current?.click()}
                      className="px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>آپلود جدید</span>
                    </button>
                  </div>
                  {postForm.imageUrl && (
                    <div className="mt-2 h-40 w-full max-w-md rounded-xl overflow-hidden border border-slate-800">
                      <img src={postForm.imageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-bold text-slate-300">کلمات کلیدی / تگ‌ها (با ویرگول جدا کنید)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="مثال: انگیزه, عادت‌ها, مدیریت زمان"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-[10px] text-slate-500">تگ‌ها برای فیلتر کردن مقالات در لندینگ استفاده می‌شوند.</p>
                </div>

                <div className="col-span-full space-y-2">
                  <label className="block text-xs font-bold text-slate-300">متن کامل مقاله (پشتیبانی از فرمت‌دهی ساده یا پاراگراف)</label>
                  <textarea
                    rows={10}
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="متن کامل و علمی مقاله خود را در اینجا بنویسید. برای ایجاد پاراگراف جدید دکمه Enter را بزنید. می‌توانید از عناوین با فرمت ### یا لیست با - استفاده کنید."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    if (!postForm.title.trim() || !postForm.excerpt.trim() || !postForm.content.trim()) {
                      setMessage('خطا: لطفا عنوان، خلاصه و متن مقاله را وارد کنید.');
                      return;
                    }
                    const tagsArr = tagInput.split(',').map(t => t.trim()).filter(Boolean);
                    const slug = postForm.title
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-zA-Z0-9آ-ی۰-۹\s]/g, '')
                      .replace(/\s+/g, '-');

                    const updatedPosts = [...(landingConfig.encyclopedia_posts || [])];
                    if (editingPostId === 'new') {
                      const newPost: BlogPost = {
                        ...postForm,
                        id: `post_${Date.now()}`,
                        date: new Date().toLocaleDateString('fa-IR'),
                        tags: tagsArr,
                        slug
                      };
                      updatedPosts.push(newPost);
                    } else {
                      const index = updatedPosts.findIndex(p => p.id === editingPostId);
                      if (index !== -1) {
                        updatedPosts[index] = {
                          ...postForm,
                          tags: tagsArr,
                          slug
                        };
                      }
                    }

                    setLandingConfig((prev: any) => ({
                      ...prev,
                      encyclopedia_posts: updatedPosts
                    }));

                    setEditingPostId(null);
                    setPostForm({
                      id: '',
                      title: '',
                      excerpt: '',
                      content: '',
                      category: 'بهره‌وری',
                      tags: [],
                      date: '',
                      readTime: '۵ دقیقه',
                      slug: ''
                    });
                    setTagInput('');
                    setMessage('تغییرات مقاله ثبت موقت شد. برای ذخیره دائمی دکمه به‌روزرسانی محتوا را در انتهای صفحه بزنید.');
                    setTimeout(() => setMessage(''), 4000);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  ثبت موقت مقاله
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(null);
                    setPostForm({
                      id: '',
                      title: '',
                      excerpt: '',
                      content: '',
                      category: 'بهره‌وری',
                      tags: [],
                      date: '',
                      readTime: '۵ دقیقه',
                      slug: ''
                    });
                    setTagInput('');
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(landingConfig.encyclopedia_posts || []).length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <HelpCircle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-bold">هیچ مقاله‌ای در دانشنامه وجود ندارد.</p>
                  <p className="text-xs text-slate-600 mt-1">با زدن دکمه «افزودن مقاله جدید» اولین مقاله را اضافه کنید.</p>
                </div>
              ) : (
                (landingConfig.encyclopedia_posts || []).map((post: BlogPost) => (
                  <div key={post.id} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {post.imageUrl ? (
                        <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-800/80">
                          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-36 w-full rounded-xl bg-indigo-950/20 border border-dashed border-indigo-900/40 flex items-center justify-center text-indigo-400">
                          <ImageIcon className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold">{post.category}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-white line-clamp-2 leading-relaxed">{post.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-900/80">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setPostForm(post);
                            setTagInput(post.tags.join(', '));
                          }}
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                          title="ویرایش مقاله"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (landingConfig.encyclopedia_posts || []).filter((p: any) => p.id !== post.id);
                            setLandingConfig((prev: any) => ({
                              ...prev,
                              encyclopedia_posts: updated
                            }));
                            setMessage('مقاله با موفقیت حذف شد. برای ذخیره دائمی دکمه به‌روزرسانی محتوا را در انتهای صفحه بزنید.');
                            setTimeout(() => setMessage(''), 4000);
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="حذف مقاله"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Action */}
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
          <span>به‌روزرسانی محتوا</span>
        </button>
        {message && <span className={`text-sm ${message.includes('خطا') ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</span>}
      </div>

      {/* Media Library Modal */}
      <AnimatePresence>
        {isMediaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-purple-950/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">آرشیو رسانه‌های سایبان</h3>
                    <p className="text-xs text-slate-400 mt-0.5">مدیریت، پیش‌نمایش و انتخاب فایل‌های قبلاً آپلود شده بدون آپلود تکراری</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar & Filters */}
              <div className="p-4 bg-slate-950/20 border-b border-slate-800/80 flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    placeholder="جستجو در نام فایل..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all text-right"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {/* Category Folder Filter */}
                  <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setMediaFilterFolder('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mediaFilterFolder === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      همه بخش‌ها
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaFilterFolder('uploads')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mediaFilterFolder === 'uploads' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      عمومی
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaFilterFolder('audio')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mediaFilterFolder === 'audio' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      موزیک‌ها
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaFilterFolder('encyclopedia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mediaFilterFolder === 'encyclopedia' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      دانشنامه
                    </button>
                  </div>

                  {/* Format Filter */}
                  <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                    <button
                      type="button"
                      disabled={mediaAllowedType !== 'all'}
                      onClick={() => setMediaFilterType('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mediaAllowedType !== 'all' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${mediaFilterType === 'all' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      همه فرمت‌ها
                    </button>
                    <button
                      type="button"
                      disabled={mediaAllowedType === 'audio'}
                      onClick={() => setMediaFilterType('image')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mediaAllowedType === 'audio' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${mediaFilterType === 'image' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      تصاویر
                    </button>
                    <button
                      type="button"
                      disabled={mediaAllowedType === 'image'}
                      onClick={() => setMediaFilterType('audio')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mediaAllowedType === 'image' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${mediaFilterType === 'audio' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      صوتی
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* File Grid */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                  {mediaLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <span className="text-xs font-bold">در حال خواندن اطلاعات فایل‌ها از سرور...</span>
                    </div>
                  ) : (
                    (() => {
                      const filtered = mediaFiles
                        .filter(f => {
                          const matchesSearch = f.name.toLowerCase().includes(mediaSearch.toLowerCase());
                          const matchesFolder = mediaFilterFolder === 'all' || f.folder === mediaFilterFolder;
                          
                          let matchesType = true;
                          if (mediaAllowedType === 'image') {
                            matchesType = f.type === 'image';
                          } else if (mediaAllowedType === 'audio') {
                            matchesType = f.type === 'audio';
                          } else {
                            matchesType = mediaFilterType === 'all' || f.type === mediaFilterType;
                          }

                          return matchesSearch && matchesFolder && matchesType;
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                            <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
                            <p className="text-sm font-black text-slate-400">هیچ فایلی یافت نشد</p>
                            <p className="text-xs text-slate-600 mt-1">تغییر فیلترها را بررسی کنید یا فایل جدیدی آپلود کنید.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {filtered.map((file) => {
                            const isSelected = selectedMediaFile?.id === file.id;
                            return (
                              <div
                                key={file.id}
                                onClick={() => setSelectedMediaFile(file)}
                                className={`group relative bg-slate-950/40 border rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all ${isSelected ? 'border-purple-500 bg-purple-500/5 ring-1 ring-purple-500/30' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-950/60'}`}
                              >
                                {/* Preview Block */}
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center relative border border-slate-900 mb-2">
                                  {file.type === 'image' ? (
                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                  ) : file.type === 'audio' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-teal-950/10 text-teal-400">
                                      <Music className="w-8 h-8 opacity-80" />
                                      <span className="text-[9px] font-mono mt-1 text-teal-500/80">Audio format</span>
                                    </div>
                                  ) : (
                                    <File className="w-8 h-8 text-slate-500" />
                                  )}

                                  {/* Folder Indicator badge */}
                                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800">
                                    {file.folder === 'uploads' ? 'عمومی' : file.folder === 'audio' ? 'موزیک' : 'دانشنامه'}
                                  </span>

                                  {/* Selection marker */}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-purple-950/20 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg">
                                        <Check className="w-5 h-5" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Details Block */}
                                <div className="space-y-1">
                                  <p className="text-[11px] font-bold text-slate-200 truncate" dir="ltr" title={file.name}>
                                    {file.name}
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                    <span>{formatBytes(file.size)}</span>
                                    <span>{new Date(file.created_at).toLocaleDateString('fa-IR')}</span>
                                  </div>
                                </div>

                                {/* Hover actions */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {deletingFileId === file.id ? (
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteMediaFile(file);
                                        }}
                                        className="bg-rose-600 hover:bg-rose-500 text-white p-1 rounded text-[9px] font-bold transition-colors cursor-pointer"
                                      >
                                        حذف
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingFileId(null);
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded text-[9px] font-bold transition-colors cursor-pointer"
                                      >
                                        نه
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingFileId(file.id);
                                      }}
                                      className="p-1.5 bg-rose-950/90 text-rose-400 hover:text-rose-300 border border-rose-900/60 hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
                                      title="حذف کامل این فایل از سرور"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Info Panel / Preview */}
                <div className="hidden lg:flex w-80 border-r border-slate-800 bg-slate-950/40 p-5 flex-col justify-between overflow-y-auto">
                  {selectedMediaFile ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 font-mono bg-purple-500/10 px-2.5 py-1 rounded-full">
                          جزئیات فایل انتخابی
                        </span>
                        <h4 className="text-sm font-black text-white pt-2 line-clamp-2" dir="ltr">
                          {selectedMediaFile.name}
                        </h4>
                      </div>

                      {/* Visual Preview */}
                      <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex items-center justify-center min-h-[140px]">
                        {selectedMediaFile.type === 'image' ? (
                          <img src={selectedMediaFile.url} alt="Large preview" className="max-w-full max-h-[180px] object-contain rounded-xl" />
                        ) : selectedMediaFile.type === 'audio' ? (
                          <div className="w-full py-4 text-center space-y-4">
                            <Music className="w-12 h-12 text-teal-500 mx-auto animate-pulse" />
                            <audio src={selectedMediaFile.url} controls className="w-full h-8 px-2" />
                          </div>
                        ) : (
                          <div className="text-center space-y-2 py-4">
                            <File className="w-12 h-12 text-slate-500 mx-auto" />
                            <span className="text-xs text-slate-400 block font-mono">Format unsupported</span>
                          </div>
                        )}
                      </div>

                      {/* Technical Info */}
                      <div className="space-y-3 text-xs border-t border-slate-800/80 pt-4 text-slate-400 font-medium">
                        <div className="flex justify-between">
                          <span>حجم فایل:</span>
                          <span className="font-mono font-bold text-slate-200">{formatBytes(selectedMediaFile.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>پوشه ذخیره:</span>
                          <span className="font-bold text-slate-200">{selectedMediaFile.folder === 'uploads' ? 'عمومی (uploads)' : selectedMediaFile.folder === 'audio' ? 'موزیک (audio)' : 'دانشنامه (encyclopedia)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>فرمت تشخیص داده شده:</span>
                          <span className="font-mono font-bold text-slate-200">{selectedMediaFile.type === 'image' ? 'تصویر (Image)' : selectedMediaFile.type === 'audio' ? 'صوتی (Audio)' : 'سایر (Other)'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>تاریخ آپلود:</span>
                          <span className="font-bold text-slate-200">{new Date(selectedMediaFile.created_at).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-800/80 pt-4">
                        <label className="block text-[10px] text-slate-500 font-bold">آدرس اینترنتی فایل (Public URL):</label>
                        <input
                          type="text"
                          readOnly
                          value={selectedMediaFile.url}
                          className="w-full px-2.5 py-2 bg-slate-950 border border-slate-850 rounded-lg text-[10px] text-slate-400 font-mono text-left focus:outline-none"
                          dir="ltr"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-3">
                      <ImageIcon className="w-12 h-12 text-slate-800" />
                      <div>
                        <p className="text-xs font-bold text-slate-400">فایلی انتخاب نشده است</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">برای نمایش پیش‌نمایش، جزئیات فنی و تأیید نهایی، روی یکی از فایل‌های گالری کلیک کنید.</p>
                      </div>
                    </div>
                  )}

                  {/* Actions inside sidepanel */}
                  {selectedMediaFile && (
                    <button
                      type="button"
                      onClick={() => {
                        if (mediaOnSelectCallback) {
                          mediaOnSelectCallback(selectedMediaFile.url, selectedMediaFile.name);
                        }
                        setIsMediaModalOpen(false);
                      }}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/15 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>تایید و انتخاب این فایل</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Footer (for mobile support or quick summary selection) */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between lg:hidden">
                {selectedMediaFile ? (
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="text-xs font-bold text-slate-300 truncate max-w-[180px] sm:max-w-[300px]" dir="ltr">
                      انتخاب شده: {selectedMediaFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (mediaOnSelectCallback) {
                          mediaOnSelectCallback(selectedMediaFile.url, selectedMediaFile.name);
                        }
                        setIsMediaModalOpen(false);
                      }}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>تایید فایل</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">لطفا فایلی را برای انتخاب لمس کنید...</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
