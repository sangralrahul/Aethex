/**
 * Cadus: the clinical AI workspace inside Aethex.
 * Backend: `cadus` on the site's Cloudflare Worker at /api/fn/cadus
 * (Anthropic Claude only). See worker/index.ts.
 */
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ReactNode, type DragEvent as ReactDragEvent, type FocusEvent as ReactFocusEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent,
} from "react";
import {
  AlertTriangle, Bed, AlarmClock,  Mountain, Briefcase, SearchCheck, UserRoundPen,  Smile, Columns3, LibraryBig, Snowflake, MessagesSquare, GlassWater, LifeBuoy, Trophy, Package, StickyNote, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Bookmark, BookmarkCheck, BookOpen, BookOpenCheck, Brain, Gauge,
  Calculator, Camera, Check, ChevronDown, ChevronRight, ChevronsUpDown, CircleQuestionMark, ClipboardCheck, ClipboardList, Copy, CornerDownRight,
  Flame, Languages, Mail, MessageCircleQuestion, Target, UserCog, UserRound,
  Archive, ArchiveRestore, AudioLines, Bell, ChevronLeft, Ellipsis, FileDown, FilePen, Lightbulb, MessageSquareDashed, Paperclip, Share2,
  ThumbsDown, ThumbsUp,
  Database, Download, ExternalLink, FileText, FlaskConical, Folder, FolderInput, FolderMinus, FolderPlus, Globe,
  GraduationCap, Grip, History, House, ImagePlus, Info, Keyboard, Laptop, Layers, LayoutGrid, Library, ListFilter, LogIn,
  LogOut, Menu, MessageSquare, Mic, Moon, Siren, Baby, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Pill, Pin, PinOff, Play,
  Plus, Presentation, RefreshCw, Scale, Search, Settings, ShieldAlert, ShieldCheck, ShoppingBag, SlidersHorizontal,
  Sparkles, Square, SquarePen, Stethoscope, Sun, Syringe, Telescope, Trash2, Users, Volume2, VolumeX, X, Zap, Palette,
  BedDouble, BookMarked, BookOpenText, ChartLine, ClipboardPlus, FileBadge, FileSignature, Microscope, NotebookPen, NotepadText,
  Printer, Scissors, ScrollText, Sigma, PanelRight, EyeOff, Compass, Rows3, WifiOff, Building2, ScanSearch,
  Bot, GitBranch, HeartPulse, MessageCircle, BellRing, FileScan, ShieldPlus, ScanLine, Shield, Bone, AtSign, Users2, GitFork, CalendarDays, FileOutput, ArrowRightLeft, Waypoints, CalendarCheck, Activity, Bug, ListChecks, FlaskRound, Wind, BookCheck, CalendarClock, Eye, Ear, Droplets, Swords, Workflow, Headphones,
  type LucideIcon,
  FileAudio, MicVocal, Speech, CalendarHeart, PillBottle, ListOrdered, Images, Weight, Timer, PhoneCall, CalendarRange, FolderHeart, AudioWaveform, BarChart3, MessageSquareText, Salad, FileCode2, Gavel, Droplet, Pipette, Heart, Fan, Video, ReceiptIndianRupee, Dog, Bandage, Thermometer, Award, CalendarPlus, Warehouse, HeartHandshake, Bean, Ruler, ContactRound, Wallet, BriefcaseMedical, DatabaseBackup, TrendingUp, BugOff, Ambulance, Biohazard, PersonStanding, Ribbon, HandHeart, ThermometerSun, TestTubes,
  Wine, Footprints,
  Accessibility, CigaretteOff, AirVent, HeartCrack, Candy,
  Milk, Repeat, BrainCircuit, Hand,
  Hourglass, BrainCog,
  Flower2,
  Waves, CircleDot,
  Star, Upload,
  TestTube, Utensils,
} from "lucide-react";
import { invokeAi } from "@/lib/ai-functions";
import { useUserAuth } from "@/hooks/use-user-auth";
import CadusMark, { CADUS_ICON_DATA_URL } from "@/components/cadus/CadusMark";
import CameraModal from "@/components/cadus/CameraModal";
import PresentationViewer, { type PresentationData } from "@/components/cadus/PresentationViewer";
import { CADUS_CSS } from "@/components/cadus/cadus-styles";
import { markdownToText, renderMarkdown } from "@/lib/cadus-markdown";
import {
  composeFromLibrary, libraryFootnote, libraryNotFound, medicalLibrary, SOURCE_SHORT,
  type LibraryManifest, type LibraryResult,
} from "@/lib/medlib/library";
import { queryTerms } from "@/lib/medlib/text";
import { isCadusHost, mainUrl } from "@/lib/host";
import ClinicalCalculators, { InteractionNotice, type ToolsTab } from "@/components/cadus/ClinicalCalculators";
import PracticeView from "@/components/cadus/PracticeView";
import ProfileDialog from "@/components/cadus/ProfileDialog";
import { CADUS_TOOLS_CSS } from "@/components/cadus/cadus-tools-styles";
import { CALC_BY_ID, CALCULATORS, suggestCalculators } from "@/lib/cadus/calculators";
import { checkText, type IxMatch } from "@/lib/cadus/interactions";
import { deidentify, describeHits, KIND_LABEL, stripPlaceholders, type Deidentified, type IdentifierKind } from "@/lib/cadus/deidentify";
import { accuracy, EMPTY_PRACTICE, readPractice, savePractice, streak, totals, type PracticeState } from "@/lib/cadus/practice";
import {
  daysToExam, practiceExam, practitionerBadge, profilePayload, profileSummary, readProfile, saveProfile,
  type MedicalProfile, type ProfileRole,
} from "@/lib/cadus/profile";
import { CASE_MODES, looksLikeCase, WARD_ACTIONS } from "@/lib/cadus/ward";
import { LiveAnswer, MdBlock } from "@/components/cadus/LiveAnswer";
import CanvasPanel, { type CanvasDoc } from "@/components/cadus/CanvasPanel";
import VoiceMode, { speakable, voiceSupported, type VoicePersona } from "@/components/cadus/VoiceMode";
import AudioLibraryView from "@/components/cadus/AudioLibraryView";
import RxWriterView from "@/components/cadus/RxWriterView";
import LabTrendsView from "@/components/cadus/LabTrendsView";
import DailyCaseView from "@/components/cadus/DailyCaseView";
import DocWriterView from "@/components/cadus/DocWriterView";
import MnemonicView from "@/components/cadus/MnemonicView";
import GenericFinderView from "@/components/cadus/GenericFinderView";
import OpdQueueView from "@/components/cadus/OpdQueueView";
import ImageQuizView from "@/components/cadus/ImageQuizView";
import DoseCardView from "@/components/cadus/DoseCardView";
import OnCallView from "@/components/cadus/OnCallView";
import JournalClubView from "@/components/cadus/JournalClubView";
import StatsChooserView from "@/components/cadus/StatsChooserView";
import RosterView from "@/components/cadus/RosterView";
import RecordsView, { type RecordIncoming } from "@/components/cadus/RecordsView";
import VoiceRoundView from "@/components/cadus/VoiceRoundView";
import RevNotesView from "@/components/cadus/RevNotesView";
import AnalyticsView from "@/components/cadus/AnalyticsView";
import PreopView from "@/components/cadus/PreopView";
import PatientMessageView from "@/components/cadus/PatientMessageView";
import PregLactView from "@/components/cadus/PregLactView";
import PillChartView from "@/components/cadus/PillChartView";
import VaccinesView from "@/components/cadus/VaccinesView";
import DietView from "@/components/cadus/DietView";
import IcdView from "@/components/cadus/IcdView";
import ConsentView from "@/components/cadus/ConsentView";
import InsulinView from "@/components/cadus/InsulinView";
import TransfusionView from "@/components/cadus/TransfusionView";
import MlcView from "@/components/cadus/MlcView";
import TbView from "@/components/cadus/TbView";
import AntenatalView from "@/components/cadus/AntenatalView";
import VentilatorView from "@/components/cadus/VentilatorView";
import TeleconsultView from "@/components/cadus/TeleconsultView";
import BillsView from "@/components/cadus/BillsView";
import AnimalBiteView from "@/components/cadus/AnimalBiteView";
import NeedlestickView from "@/components/cadus/NeedlestickView";
import ImnciView from "@/components/cadus/ImnciView";
import CmeView from "@/components/cadus/CmeView";
import AppointmentsView from "@/components/cadus/AppointmentsView";
import StockView from "@/components/cadus/StockView";
import ScreeningView from "@/components/cadus/ScreeningView";
import KidneyDoseView from "@/components/cadus/KidneyDoseView";
import SamView from "@/components/cadus/SamView";
import ContactsView from "@/components/cadus/ContactsView";
import AccountsView from "@/components/cadus/AccountsView";
import ThyroidView from "@/components/cadus/ThyroidView";
import BackupView from "@/components/cadus/BackupView";
import NcdView from "@/components/cadus/NcdView";
import AnaemiaView from "@/components/cadus/AnaemiaView";
import DengueView from "@/components/cadus/DengueView";
import ElectrolytesView from "@/components/cadus/ElectrolytesView";
import ObsEmergencyView from "@/components/cadus/ObsEmergencyView";
import InfectionView from "@/components/cadus/InfectionView";
import AsthmaView from "@/components/cadus/AsthmaView";
import MilestonesView from "@/components/cadus/MilestonesView";
import ContraceptionView from "@/components/cadus/ContraceptionView";
import PalliativeView from "@/components/cadus/PalliativeView";
import ImagingRulesView from "@/components/cadus/ImagingRulesView";
import IvFluidsView from "@/components/cadus/IvFluidsView";
import BurnsView from "@/components/cadus/BurnsView";
import JaundiceView from "@/components/cadus/JaundiceView";
import StrokeView from "@/components/cadus/StrokeView";
import SepsisDkaView from "@/components/cadus/SepsisDkaView";
import AlcoholView from "@/components/cadus/AlcoholView";
import DiabeticFootView from "@/components/cadus/DiabeticFootView";
import HeatView from "@/components/cadus/HeatView";
import WoundView from "@/components/cadus/WoundView";
import AnticoagView from "@/components/cadus/AnticoagView";
import TropicalFeverView from "@/components/cadus/TropicalFeverView";
import ElderlyView from "@/components/cadus/ElderlyView";
import QuitSmokingView from "@/components/cadus/QuitSmokingView";
import CroupView from "@/components/cadus/CroupView";
import RheumaticView from "@/components/cadus/RheumaticView";
import WeightView from "@/components/cadus/WeightView";
import HypoView from "@/components/cadus/HypoView";
import GdmView from "@/components/cadus/GdmView";
import InfantFeedingView from "@/components/cadus/InfantFeedingView";
import AntidepView from "@/components/cadus/AntidepView";
import EyeEntView from "@/components/cadus/EyeEntView";
import VteView from "@/components/cadus/VteView";
import HeadacheView from "@/components/cadus/HeadacheView";
import SkinView from "@/components/cadus/SkinView";
import GoutView from "@/components/cadus/GoutView";
import PneumoniaUtiView from "@/components/cadus/PneumoniaUtiView";
import CkdView from "@/components/cadus/CkdView";
import PretermView from "@/components/cadus/PretermView";
import EpilepsyView from "@/components/cadus/EpilepsyView";
import ChildFeverView from "@/components/cadus/ChildFeverView";
import CirrhosisView from "@/components/cadus/CirrhosisView";
import DementiaView from "@/components/cadus/DementiaView";
import HtnEmergencyView from "@/components/cadus/HtnEmergencyView";
import UgibView from "@/components/cadus/UgibView";
import AkiView from "@/components/cadus/AkiView";
import HepatitisView from "@/components/cadus/HepatitisView";
import NrpView from "@/components/cadus/NrpView";
import PainView from "@/components/cadus/PainView";
import BoneView from "@/components/cadus/BoneView";
import HrtView from "@/components/cadus/HrtView";
import SyncopeView from "@/components/cadus/SyncopeView";
import HfView from "@/components/cadus/HfView";
import AfView from "@/components/cadus/AfView";
import LipidsView from "@/components/cadus/LipidsView";
import PeDvtView from "@/components/cadus/PeDvtView";
import HivView from "@/components/cadus/HivView";
import PreEclampsiaView from "@/components/cadus/PreEclampsiaView";
import SleepView from "@/components/cadus/SleepView";
import UrticariaView from "@/components/cadus/UrticariaView";
import AnaphylaxisView from "@/components/cadus/AnaphylaxisView";
import TraumaView from "@/components/cadus/TraumaView";
import ToxView from "@/components/cadus/ToxView";
import PtxView from "@/components/cadus/PtxView";
import FluidsView from "@/components/cadus/FluidsView";
import SteroidView from "@/components/cadus/SteroidView";
import RefeedView from "@/components/cadus/RefeedView";
import BackPainView from "@/components/cadus/BackPainView";
import AcsView from "@/components/cadus/AcsView";
import ChildFluidsView from "@/components/cadus/ChildFluidsView";
import AgitationView from "@/components/cadus/AgitationView";
import SuicideView from "@/components/cadus/SuicideView";
import HeadInjuryView from "@/components/cadus/HeadInjuryView";
import AbdomenView from "@/components/cadus/AbdomenView";
import FneutroView from "@/components/cadus/FneutroView";
import MeningitisView from "@/components/cadus/MeningitisView";
import StatusEpiView from "@/components/cadus/StatusEpiView";
import SodiumView from "@/components/cadus/SodiumView";
import AttackView from "@/components/cadus/AttackView";
import BridgingView from "@/components/cadus/BridgingView";
import OncoEmergView from "@/components/cadus/OncoEmergView";
import SpirometryView from "@/components/cadus/SpirometryView";
import ThyroidStormView from "@/components/cadus/ThyroidStormView";
import SickleView from "@/components/cadus/SickleView";
import HyperkView from "@/components/cadus/HyperkView";
import PancreatitisView from "@/components/cadus/PancreatitisView";
import PaedSepsisView from "@/components/cadus/PaedSepsisView";
import AirwayView from "@/components/cadus/AirwayView";
import RhabdoView from "@/components/cadus/RhabdoView";
import HypothermiaView from "@/components/cadus/HypothermiaView";
import PaedDkaView from "@/components/cadus/PaedDkaView";
import RetentionView from "@/components/cadus/RetentionView";
import PregHtnView from "@/components/cadus/PregHtnView";
import StonesView from "@/components/cadus/StonesView";
import PaedAbxView from "@/components/cadus/PaedAbxView";
import OpioidView from "@/components/cadus/OpioidView";
import CellulitisView from "@/components/cadus/CellulitisView";
import KawasakiView from "@/components/cadus/KawasakiView";
import EndocarditisView from "@/components/cadus/EndocarditisView";
import BellView from "@/components/cadus/BellView";
import PphView from "@/components/cadus/PphView";
import NeoSepsisView from "@/components/cadus/NeoSepsisView";
import RenalAbxView from "@/components/cadus/RenalAbxView";
import BrainDeathView from "@/components/cadus/BrainDeathView";
import SepticJointView from "@/components/cadus/SepticJointView";
import NeoHypoView from "@/components/cadus/NeoHypoView";
import AltitudeView from "@/components/cadus/AltitudeView";
import SerotoninView from "@/components/cadus/SerotoninView";
import PaedAsthmaView from "@/components/cadus/PaedAsthmaView";
import DkaHhsView from "@/components/cadus/DkaHhsView";
import AntenatalSteroidView from "@/components/cadus/AntenatalSteroidView";
import IronB12View from "@/components/cadus/IronB12View";
import TdmView from "@/components/cadus/TdmView";
import ContrastView from "@/components/cadus/ContrastView";
import PressureView from "@/components/cadus/PressureView";
import HyperemesisView from "@/components/cadus/HyperemesisView";
import CrewTranslateDialog from "@/components/cadus/CrewTranslateDialog";
import CrewShareCardDialog from "@/components/cadus/CrewShareCardDialog";
import CrewSchedulesView from "@/components/cadus/CrewSchedulesView";
import CrewWorkspacesView from "@/components/cadus/CrewWorkspacesView";
import CrewFactCheckDialog from "@/components/cadus/CrewFactCheckDialog";
import CrewDigestView from "@/components/cadus/CrewDigestView";
import CrewCompareView from "@/components/cadus/CrewCompareView";
import CrewVoiceView from "@/components/cadus/CrewVoiceView";
import CrewTemplatesView from "@/components/cadus/CrewTemplatesView";
import CrewTimelineView from "@/components/cadus/CrewTimelineView";
import CrewHandoffDialog from "@/components/cadus/CrewHandoffDialog";
import CrewNotesView from "@/components/cadus/CrewNotesView";
import CrewCheckinsView from "@/components/cadus/CrewCheckinsView";
import CrewStatsView from "@/components/cadus/CrewStatsView";
import CrewRoomsView from "@/components/cadus/CrewRoomsView";
import CrewDrillView from "@/components/cadus/CrewDrillView";
import CrewImproveDialog from "@/components/cadus/CrewImproveDialog";
import CrewQuizView from "@/components/cadus/CrewQuizView";
import CrewCaseRoundView from "@/components/cadus/CrewCaseRoundView";
import CrewCardSettings from "@/components/cadus/CrewCardSettings";
import CrewPacks from "@/components/cadus/CrewPacks";
import SickDayView from "@/components/cadus/SickDayView";
import LabRangesView from "@/components/cadus/LabRangesView";
import { backupDue } from "@/lib/cadus/clinic26";
import PersonalSettings from "@/components/cadus/PersonalSettings";
import { CADUS_CHAT_CSS } from "@/components/cadus/cadus-chat-styles";
import { closePartialMarkdown, createTextStore, streamCadus, StreamUnavailable, type DeepStep } from "@/lib/cadus/stream";
import {
  BUILT_IN_CREW, blankCrew, cleanCrew, CREW_ICONS, CREW_MAX, CREW_TONES, crewPayload, findCrew, INSTRUCTIONS_MAX as CREW_INSTRUCTIONS_MAX, NAME_MAX as CREW_NAME_MAX,
  readCrew, saveCrew, STARTER_MAX, TAGLINE_MAX, type CrewIcon, type CrewMember,
  CREW_GROUPS, matchCrew, readShareCode, type HuddleResult,
  readFav, saveFav, readUse, saveUse, recordUse, recentCrew, filterCrew, CREW_TEMPLATES, instructionScore, exportCrewFile, importCrewFile, crewInsights, suggestCrew, type CrewSort, type CrewFilter,
  readStyles, saveStyles, setStyle, styleSummary, readOrg, saveOrg, addCollection, deleteCollection, readPack, type CrewOrg, type ReadPack,
  buildTimeline, readHuddles, readDebates, readPlaybookRuns,
  readWorkspaces, saveWorkspaces, buildDigest, type CrewWorkspaces,
  readSchedules, saveSchedules, schedDue, type CrewSchedule,
  readNotes, saveNotes, addNote, readCheckins, saveCheckins, dueCheckins, dateKey, readDrill, bestStreak, readCaseRounds, readRooms, readQuizResults, type CrewNotes, type CheckIns, type CrewStats,
  readMemory, saveMemory, addFact, rememberFrom as crewRememberFrom, readRatings, saveRatings, rateCrew, unrateCrew, ratingSummary, type CrewFact, type CrewRating,
} from "@/lib/cadus/crew";
import CrewSecondOpinionView from "@/components/cadus/CrewSecondOpinionView";
import CrewKnowledge from "@/components/cadus/CrewKnowledge";
import { CrewImportDialog, CrewPasteImport, CrewShareDialog } from "@/components/cadus/CrewShare";
import CrewHuddleView from "@/components/cadus/CrewHuddleView";
import CrewDebateView from "@/components/cadus/CrewDebateView";
import CrewPlaybookView from "@/components/cadus/CrewPlaybookView";
import CrewBuilder from "@/components/cadus/CrewBuilder";
import PodcastView from "@/components/cadus/PodcastView";
import { VoiceSettings } from "@/components/cadus/AudioParts";
import { CADUS_CLINIC20_CSS, CADUS_CLINIC21_CSS, CADUS_CLINIC22_CSS, CADUS_CLINIC23_CSS, CADUS_CLINIC24_CSS, CADUS_CLINIC25_CSS, CADUS_CLINIC26_CSS, CADUS_CLINIC27_CSS, CADUS_CLINIC28_CSS, CADUS_CLINIC29_CSS, CADUS_CLINIC30_CSS, CADUS_CLINIC31_CSS, CADUS_CLINIC32_CSS, CADUS_CLINIC34_CSS, CADUS_CLINIC35_CSS, CADUS_CLINIC36_CSS, CADUS_CLINIC37_CSS, CADUS_CLINIC38_CSS, CADUS_CLINIC39_CSS, CADUS_CLINIC40_CSS, CADUS_CREW_CSS, CADUS_CREWPLUS_CSS, CADUS_VOICE_CSS } from "@/components/cadus/cadus-crew-styles";
import TranslatorView from "@/components/cadus/TranslatorView";
import PathwaysView from "@/components/cadus/PathwaysView";
import FlashcardsView from "@/components/cadus/FlashcardsView";
import CompareView from "@/components/cadus/CompareView";
import { CADUS_STUDIO_CSS, CADUS_TODAY_CSS, CADUS_WARD_CSS, CADUS_BEDSIDE_CSS } from "@/components/cadus/cadus-studio-styles";
import MedRecView from "@/components/cadus/MedRecView";
import PresentCoachView from "@/components/cadus/PresentCoachView";
import TodayView from "@/components/cadus/TodayView";
import DischargeView from "@/components/cadus/DischargeView";
import HandoverView from "@/components/cadus/HandoverView";
import DifferentialView from "@/components/cadus/DifferentialView";
import StudyPlanView from "@/components/cadus/StudyPlanView";
import EcgView from "@/components/cadus/EcgView";
import AntibioticView from "@/components/cadus/AntibioticView";
import ProcedureView from "@/components/cadus/ProcedureView";
import PoisonView from "@/components/cadus/PoisonView";
import InfusionView from "@/components/cadus/InfusionView";
import ConvertView from "@/components/cadus/ConvertView";
import AbgView from "@/components/cadus/AbgView";
import LogbookView from "@/components/cadus/LogbookView";
import FollowUpView from "@/components/cadus/FollowUpView";
import { ABX_KEY, ECG_KEY, POISON_KEY, PROC_KEY } from "@/lib/cadus/clinicalAi";
import { FOLLOWUP_KEY, LOG_KEY } from "@/lib/cadus/records";
import { STUDYPLAN_KEY } from "@/lib/cadus/studyplan";
import { cachedVoices, characterFromText, pickVoice, preloadVoices, speak as speakAloud, stopSpeaking, withoutStageLine } from "@/lib/cadus/voice";
import { installDesktopBridge, isOpenTarget, type OpenTarget } from "@/lib/cadus/desktop";
import { cardStats } from "@/lib/cadus/learn";
import { COMPARES_KEY, DDX_KEY, DECKS_KEY, DISCHARGE_KEY, HANDOVER_KEY, MEDREC_KEY, PATHWAYS_KEY, PRESENT_KEY, TRANSLATOR_KEY } from "@/lib/cadus/studio";
import {
  ACCEPT_ATTACH, attachmentPayload, attachmentsForStorage, attachProblem, describeAttachment, formatSize, readAttachment,
  type Attachment,
} from "@/lib/cadus/files";
import { dictationError, NO_DICTATION, speechRecognition } from "@/lib/cadus/speech";
import { addMemory, personalPayload, readPersonal, rememberFrom, savePersonal, type Personal } from "@/lib/cadus/memory";
import { downloadBlob, fileSlug, markdownToDocx } from "@/lib/cadus/docx";
import { hasLetterhead, letterheadLines, readLetterhead, saveLetterhead, SIGNED_MODES, type Letterhead } from "@/lib/cadus/letterhead";
import { contentWords, institutionPayload, readInstitution, saveInstitution, type Institution } from "@/lib/cadus/institution";
import { caseLabel, caseSummary, newCase, newEntry, readCases, saveCases, type PatientCase } from "@/lib/cadus/cases";
import { isWallpaper, wallpaperCss, WALLPAPERS, type WallpaperId } from "@/lib/cadus/wallpaper";
import CaseView from "@/components/cadus/CaseView";
import LearnView from "@/components/cadus/LearnView";
import { readLearn, saveLearn, type LearnState } from "@/lib/cadus/learn";
import DrugsView from "@/components/cadus/DrugsView";
import ShareDialog from "@/components/cadus/ShareDialog";
import type { Shared } from "@/lib/cadus/share";
import { printMarkdown } from "@/lib/cadus/printdoc";
import { evidenceRecords, evidenceSources, readReading, type Paper } from "@/lib/cadus/pubmed";
import { localDate, readWard } from "@/lib/cadus/wardlist";
import ResearchView, { type ResearchTab } from "@/components/cadus/ResearchView";
import WardView from "@/components/cadus/WardView";
import InstitutionSettings from "@/components/cadus/InstitutionSettings";
import LetterheadSettings from "@/components/cadus/LetterheadSettings";
import { CADUS_PRO_CSS } from "@/components/cadus/cadus-pro-styles";
import { CADUS_REF_CSS } from "@/components/cadus/cadus-ref-styles";
import { CADUS_WS_CSS } from "@/components/cadus/cadus-ws-styles";
import { CADUS_CLINIC_CSS } from "@/components/cadus/cadus-clinic-styles";
import { CADUS_LOOKS_CSS, LOOKS } from "@/components/cadus/cadus-looks-styles";
import { CADUS_PLUS_CSS } from "@/components/cadus/cadus-plus-styles";
import ScribeView from "@/components/cadus/ScribeView";
import ProfileSetup, { PROFILE_SETUP_CSS } from "@/components/cadus/ProfileSetup";
import { fetchRemoteProfile, pushRemoteProfile } from "@/lib/cadus/profileSync";
import { NOTES_KEY as NOTES_KEY_EXPORT } from "@/lib/cadus/scribe";
import { LEAFLETS_KEY as LEAFLETS_KEY_EXPORT } from "@/lib/cadus/leaflets";
import { RX_KEY as RX_KEY_EXPORT } from "@/lib/cadus/formulary";
import { LEARN_KEY as LEARN_KEY_EXPORT } from "@/lib/cadus/learn";
import EmergencyView from "@/components/cadus/EmergencyView";
import PaedsView from "@/components/cadus/PaedsView";
import LeafletsView from "@/components/cadus/LeafletsView";
import CaseSimView from "@/components/cadus/CaseSimView";
import RxCheckView from "@/components/cadus/RxCheckView";
import GuidelineWatchView from "@/components/cadus/GuidelineWatchView";
import ReportExplainView from "@/components/cadus/ReportExplainView";
import { CADUS_LABS_CSS } from "@/components/cadus/cadus-labs-styles";
import { EXPLAINS_KEY, RXCHECKS_KEY, SIMS_KEY, WATCH_KEY } from "@/lib/cadus/labs";
type LookId = (typeof LOOKS)[number]["id"];
import { CADUS_VERSION, LEGAL_PATH } from "@/lib/cadus/legal";
import { PLAN_BY_ID, limitsOf, planFor, planOf, priceText, type PlanId } from "@/lib/cadus/plans";
import SourcesPanel from "@/components/cadus/SourcesPanel";
import SafetyView from "@/components/cadus/SafetyView";
import HistoryView from "@/components/cadus/HistoryView";
import PrivacyView from "@/components/cadus/PrivacyView";
import Onboarding, { type OnboardingResult } from "@/components/cadus/Onboarding";
import Tour, { type TourStep } from "@/components/cadus/Tour";
import { AUDIT_KEY, auditStats, clearAudit, readAudit, recordAudit, type AuditEntry } from "@/lib/cadus/audit";
import { ONBOARD_KEY, practicePayload, readFlag, setFlag, specialtyTools, TOUR_KEY, type Units } from "@/lib/cadus/onboarding";
import { liftKeyPoints, referenceForDocument, referenceToPlain } from "@/lib/cadus/reference";
import { IX_RULE_COUNT } from "@/lib/cadus/interactions";
import { saveReading } from "@/lib/cadus/pubmed";
import { saveWard, cleanWard, newPatient, WARD_MAX } from "@/lib/cadus/wardlist";

/* ================================================================ types */

type ModeId =
  | "general" | "ddx" | "drugs" | "dosage" | "labs" | "image" | "procedure"
  | "soap" | "discharge" | "referral" | "handover" | "patient" | "research" | "mcq" | "slides" | "viva" | "osce"
  | "admission" | "progress" | "opnote" | "death" | "certificate" | "rx" | "evidence";
/** "groq" only appears in chats saved before Cadus became Claude-only. */
type Provider = "claude" | "groq" | "library";
type View = "chat" | "crew" | "second" | "tools" | "library" | "projects" | "project" | "decks" | "calculators" | "practice" | "research" | "ward" | "cases" | "drugs" | "safety" | "history" | "privacy" | "scribe" | "emergency" | "paeds" | "leaflets" | "simulator" | "rxcheck" | "watch" | "explain" | "huddle" | "debate" | "playbooks" | "podcasts" | "translate" | "pathways" | "flashcards" | "compare" | "medrec" | "present" | "today" | "discharge" | "handover" | "ddx" | "studyplan" | "ecg" | "abx" | "procedure" | "poison" | "infusions" | "convert" | "abg" | "logbook" | "followups" | "audiolib" | "rxwrite" | "labtrend" | "daily" | "letters" | "adr" | "mccd" | "mnemonics" | "generics" | "opd" | "imagequiz" | "dosecard" | "oncall" | "journal" | "stats" | "roster" | "records" | "voiceround" | "revnotes" | "analytics" | "preop" | "messages" | "preglact" | "pillchart" | "vaccines" | "diet" | "icd" | "consent" | "insulin" | "transfusion" | "mlc" | "tb" | "antenatal" | "ventilator" | "teleconsult" | "bills" | "bite" | "needlestick" | "imnci" | "cme" | "appointments" | "stock" | "screening" | "kidney" | "sam" | "contacts" | "accounts" | "thyroid" | "backup" | "ncd" | "anaemia" | "dengue" | "electrolytes" | "obsemergency" | "infection" | "asthma" | "milestones" | "contraception" | "palliative" | "imaging" | "ivfluids" | "sickday" | "labranges" | "burns" | "jaundice" | "stroke" | "bundles" | "alcohol" | "dfoot" | "heat" | "wound" | "anticoag" | "fevers" | "elderly" | "quitsmoking" | "croup" | "rheumatic" | "weight" | "hypo" | "gdm" | "infantfeed" | "antidep" | "eyeent" | "vte" | "headache" | "skin" | "gout" | "pnuti" | "ckd" | "preterm" | "epilepsy" | "childfever" | "cirrhosis" | "dementia" | "htnemergency" | "ugib" | "aki" | "hepbc" | "nrp" | "pain" | "bone" | "hrt" | "syncope" | "hf" | "af" | "lipids" | "pedvt" | "hiv" | "preeclampsia" | "sleep" | "urticaria" | "anaphylaxis" | "trauma" | "tox" | "ptx" | "fluids" | "steroid" | "refeed" | "backpain" | "acs" | "childfluids" | "agitation" | "suicide" | "headinjury" | "abdomen" | "fneutro" | "meningitis" | "quizbattle" | "caseround" | "statusepi" | "sodium" | "attack" | "bridging" | "oncoemerg" | "spirometry" | "thyroidstorm" | "sickle" | "rooms" | "drill" | "hyperk" | "pancreatitis" | "paedsepsis" | "airway" | "rhabdo" | "hypothermia" | "paeddka" | "retention" | "crewnotes" | "checkins" | "crewstats" | "preghtn" | "stones" | "paedabx" | "opioid" | "cellulitis" | "kawasaki" | "endocarditis" | "bell" | "crewcompare" | "crewvoice" | "crewtemplates" | "crewtimeline" | "pph" | "neosepsis" | "renalabx" | "braindeath" | "septicjoint" | "neohypo" | "altitude" | "serotonin" | "crewworkspaces" | "crewdigest" | "paedasthma" | "dkahhs" | "ansteroid" | "ironb12" | "tdm" | "contrast" | "pressure" | "hyperemesis" | "crewschedules";
/** Views reached from the Tools hub, so the hub stays highlighted in the sidebar. */
const TOOL_VIEWS = new Set<View>(["tools", "ward", "research", "drugs", "calculators", "projects", "project", "decks", "scribe", "emergency", "paeds", "leaflets", "simulator", "rxcheck", "watch", "explain", "translate", "pathways", "flashcards", "compare", "medrec", "present", "today", "discharge", "handover", "ddx", "studyplan", "podcasts", "ecg", "abx", "procedure", "poison", "infusions", "convert", "abg", "logbook", "followups", "audiolib", "rxwrite", "labtrend", "daily", "letters", "adr", "mccd", "mnemonics", "generics", "opd", "imagequiz", "dosecard", "oncall", "journal", "stats", "roster", "records", "voiceround", "revnotes", "analytics", "preop", "messages", "preglact", "pillchart", "vaccines", "diet", "icd", "consent", "insulin", "transfusion", "mlc", "tb", "antenatal", "ventilator", "teleconsult", "bills", "bite", "needlestick", "imnci", "cme", "appointments", "stock", "screening", "kidney", "sam", "contacts", "accounts", "thyroid", "backup", "ncd", "anaemia", "dengue", "electrolytes", "obsemergency", "infection", "asthma", "milestones", "contraception", "palliative", "imaging", "ivfluids", "sickday", "labranges", "burns", "jaundice", "stroke", "bundles", "alcohol", "dfoot", "heat", "wound", "anticoag", "fevers", "elderly", "quitsmoking", "croup", "rheumatic", "weight", "hypo", "gdm", "infantfeed", "antidep", "eyeent", "vte", "headache", "skin", "gout", "pnuti", "ckd", "preterm", "epilepsy", "childfever", "cirrhosis", "dementia", "htnemergency", "ugib", "aki", "hepbc", "nrp", "pain", "bone", "hrt", "syncope", "hf", "af", "lipids", "pedvt", "hiv", "preeclampsia", "sleep", "urticaria", "anaphylaxis", "trauma", "tox", "ptx", "fluids", "steroid", "refeed", "backpain", "acs", "childfluids", "agitation", "suicide", "headinjury", "abdomen", "fneutro", "meningitis", "statusepi", "sodium", "attack", "bridging", "oncoemerg", "spirometry", "thyroidstorm", "sickle", "hyperk", "pancreatitis", "paedsepsis", "airway", "rhabdo", "hypothermia", "paeddka", "retention", "preghtn", "stones", "paedabx", "opioid", "cellulitis", "kawasaki", "endocarditis", "bell", "pph", "neosepsis", "renalabx", "braindeath", "septicjoint", "neohypo", "altitude", "serotonin", "paedasthma", "dkahhs", "ansteroid", "ironb12", "tdm", "contrast", "pressure", "hyperemesis"]);
type ToolTab = "all" | "clinical" | "documentation" | "learning";
type SettingsTab = "general" | "personal" | "letterhead" | "institution" | "data" | "shortcuts" | "about";
type StyleId = "concise" | "balanced" | "detailed";
/** Cadus modes, picked beside the message box (like Grok's and ChatGPT's): how each answer is written. */
type AnswerModeId = "auto" | "fast" | "think" | "exam" | "simple" | "deep";
type ToneId = "professional" | "friendly" | "mentor";

interface SourceRef {
  n: number;
  url: string;
  title: string;
}

interface ReviewMeta {
  verdict: "approved" | "corrected";
  confidence: "high" | "moderate" | "low";
  checked: string[];
  changes: string[];
  model?: string;
  provider?: Provider;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ModeId;
  at: number;
  image?: string;
  deck?: PresentationData;
  provider?: Provider;
  model?: string;
  error?: boolean;
  stopped?: boolean;
  /** user message: live sources were requested */
  search?: boolean;
  sources?: SourceRef[];
  queries?: string[];
  review?: ReviewMeta;
  reviewNote?: string;
  /** Answered in Library mode (no AI credits): written by the backup model from library passages, or quoted. */
  library?: { mode: "llm" | "extract"; reason: string; articles: number };
  /** user message: identifiers the privacy guard hid before sending */
  privacy?: { total: number; hits: Partial<Record<IdentifierKind, number>> };
  /** user message: reply language for this message only (e.g. a patient explanation in Hindi) */
  lang?: string;
  /** user message: attached images, PDFs and text files */
  files?: Attachment[];
  /** user message: "Think deeper" was on */
  think?: boolean;
  /** user message: the Read tool's image or report type (xray, ecg, skin, ct, lab, rx, fundus, usg) */
  reading?: string;
  /** user message: asked in voice mode (short, spoken answer) */
  voice?: boolean;
  /** user message: numbered records attached for an evidence summary; they become the answer's sources */
  refs?: SourceRef[];
  /** assistant message: earlier versions from regenerating, oldest first */
  versions?: Msg[];
  /** assistant message: the user's thumbs up or down */
  feedback?: "up" | "down";
  /** assistant message: what was wrong, from the thumbs-down form */
  feedbackNote?: { reasons: string[]; comment: string };
  /** assistant message: milliseconds from question to answer */
  took?: number;
  /** assistant message: the institution's local protocols that went with the question */
  protocols?: string[];
  /** user message: the Cadus mode it was asked in (Fast, Exam, Simple or Deep Dive; Think is `think`) */
  amode?: "fast" | "exam" | "simple" | "deep";
  /** user message: the tone asked for (professional when unset) */
  tone?: "friendly" | "mentor";
  /** assistant message: a Deep Dive report: its stages, and how many papers and web sources were read */
  deep?: { title?: string; steps: DeepStep[]; papers: number; web: number };
  /** assistant message: follow-up questions written for this answer */
  followups?: string[];
  /** user message: an @mentioned Crew assistant answers this one message; assistant message: the assistant that answered */
  mention?: { id: string; name: string; icon: CrewIcon; tone: CrewMember["tone"] };
}

interface Session {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
  pinned?: boolean;
  /** The project this chat belongs to, if any. */
  projectId?: string;
  /** Temporary chat: never saved, doesn't use memory. */
  temp?: boolean;
  archived?: boolean;
  /** The title came from the first message and can be replaced by a better one. */
  autoTitle?: boolean;
  /** The patient case this chat is about. */
  caseId?: string;
  /** The Cadus Crew assistant this chat is with. */
  crewId?: string;
}

interface Project {
  id: string;
  name: string;
  /** Standing instructions sent with every chat in the project. */
  instructions: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedItem {
  id: string;
  sessionId: string;
  messageId: string;
  question: string;
  answer: string;
  mode: ModeId;
  at: number;
  sources?: SourceRef[];
}

interface Prefs {
  theme: "light" | "dark" | "system";
  accent: string;
  textSize: "s" | "m" | "l";
  style: StyleId;
  language: string;
  enterToSend: boolean;
  /** Second-model safety review of every answer. */
  safetyReview: boolean;
  /** Search trusted sources by default. */
  sources: boolean;
  /** Typeface for Cadus answers. */
  answerFont: "serif" | "sans";
  /** Which Cadus model writes the answers. */
  model: ModelId;
  /** Hide patient identifiers (names, phone numbers, Aadhaar, UHID...) before a message is sent. */
  privacyGuard: boolean;
  /** A quiet pattern behind the chat and home page. */
  wallpaper: WallpaperId;
  /** The overall look: clinical (default), editorial or mono. */
  look: LookId;
  /** Show a notification when an answer is ready and Cadus is in a background tab. */
  notify: boolean;
  /** Units in answers: conventional (mg/dL, as Indian laboratories report) or SI. */
  units: Units;
  /** Prefer NLEM essential medicines and generic names. */
  nlem: boolean;
  /** Compact density fits more on the screen. */
  density: "comfortable" | "compact";
  /** The Cadus mode for new questions. */
  answerMode: AnswerModeId;
  /** The tone of answers. */
  tone: ToneId;
}

interface ModeDef {
  id: ModeId;
  label: string;
  short: string;
  icon: LucideIcon;
  desc: string;
  placeholder: string;
  busy: string;
  example: string;
  cat: Exclude<ToolTab, "all"> | "general";
  /** Started from elsewhere in Cadus (an evidence summary from Research), not picked as a tool. */
  hidden?: boolean;
}

interface PaletteItem {
  key: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

/* ============================================================ constants */

const MODES: ModeDef[] = [
  { id: "general", cat: "general", label: "General", short: "General", icon: Sparkles, desc: "Any clinical or academic question", placeholder: "Ask a clinical question or describe a case…", busy: "Thinking it through", example: "Explain the mechanism of SGLT2 inhibitors." },
  { id: "ddx", cat: "clinical", label: "Differential diagnosis", short: "Differentials", icon: Stethoscope, desc: "Ranked differentials, red flags and the next best test", placeholder: "Describe the case: age, sex, symptoms, signs, vitals…", busy: "Ranking differentials", example: "28F, fever, joint pain, malar rash and proteinuria." },
  { id: "drugs", cat: "clinical", label: "Drug interactions", short: "Interactions", icon: Pill, desc: "Severity, mechanism and how to manage each interaction", placeholder: "List the medicines, e.g. warfarin, amiodarone, aspirin", busy: "Checking interactions", example: "Warfarin with clarithromycin and omeprazole." },
  { id: "dosage", cat: "clinical", label: "Dose calculator", short: "Dosing", icon: Syringe, desc: "Weight- and renal-adjusted dosing, shown step by step", placeholder: "Drug, indication, weight, age, eGFR…", busy: "Calculating the dose", example: "Vancomycin for a 70 kg adult with eGFR 40." },
  { id: "labs", cat: "clinical", label: "Lab interpretation", short: "Labs", icon: FlaskConical, desc: "Flag abnormal values and find the unifying pattern", placeholder: "Paste lab values, e.g. Hb 8.2, MCV 68, ferritin 9…", busy: "Interpreting results", example: "Na 128, K 5.9, glucose 62, low morning cortisol." },
  { id: "image", cat: "clinical", label: "Image analysis", short: "Imaging", icon: ImagePlus, desc: "Systematic reads of X-rays, ECGs, skin and reports", placeholder: "Attach an image and say what you need…", busy: "Reviewing the image", example: "Upload a chest X-ray and ask for a systematic read." },
  { id: "procedure", cat: "clinical", label: "Procedure guide", short: "Procedures", icon: BookOpenCheck, desc: "Indications, kit, technique and complications", placeholder: "Procedure, e.g. lumbar puncture", busy: "Preparing the guide", example: "Ultrasound-guided central line insertion." },
  { id: "soap", cat: "documentation", label: "SOAP note", short: "SOAP note", icon: ClipboardList, desc: "Turn rough case notes into a clean SOAP note", placeholder: "Paste your case notes…", busy: "Drafting the note", example: "Paste ward-round notes to structure them." },
  { id: "handover", cat: "documentation", label: "Rounds presentation", short: "Rounds (SBAR)", icon: ClipboardCheck, desc: "SBAR handover with a 60-second spoken version", placeholder: "Paste the case or your notes for the ward round…", busy: "Preparing the presentation", example: "Turn my admission notes into an SBAR for the morning round." },
  { id: "referral", cat: "documentation", label: "Referral letter", short: "Referral", icon: Mail, desc: "A specialist referral letter from the case", placeholder: "Describe the patient, who you're referring to and why…", busy: "Writing the letter", example: "Refer a 60M with new AF and a CHA₂DS₂-VASc of 3 to cardiology." },
  { id: "discharge", cat: "documentation", label: "Discharge summary", short: "Discharge", icon: FileText, desc: "A structured discharge summary from your notes", placeholder: "Paste admission details, hospital course, procedures and medicines…", busy: "Drafting the summary", example: "Paste the admission and course to draft one." },
  { id: "admission", cat: "documentation", label: "Admission note", short: "Admission", icon: ClipboardPlus, desc: "A complete clerking from your history and examination", placeholder: "Paste the history, examination and first investigations…", busy: "Writing the admission note", example: "58M, fever and cough for 5 days, SpO₂ 91%: write the clerking." },
  { id: "progress", cat: "documentation", label: "Progress note", short: "Progress", icon: NotebookPen, desc: "A problem-based daily note with today's plan and jobs", placeholder: "Today's events, vitals, examination and new results…", busy: "Writing the progress note", example: "Day 3 of pneumonia: afebrile, CRP falling, plan the switch to oral antibiotics." },
  { id: "opnote", cat: "documentation", label: "Operative note", short: "Op note", icon: Scissors, desc: "A structured operative note from the procedure details", placeholder: "Procedure, findings, technique, blood loss, closure and post-op plan…", busy: "Writing the operative note", example: "Laparoscopic cholecystectomy for symptomatic gallstones." },
  { id: "death", cat: "documentation", label: "Death summary", short: "Death summary", icon: ScrollText, desc: "A death summary with the MCCD cause-of-death sequence", placeholder: "Admission details, hospital course, events before death and the time of death…", busy: "Writing the death summary", example: "Septic shock from pneumonia in a 72M with COPD." },
  { id: "certificate", cat: "documentation", label: "Medical certificate", short: "Certificate", icon: FileBadge, desc: "Sickness and fitness certificates, ready for you to sign", placeholder: "Type of certificate, diagnosis and the dates of leave or fitness…", busy: "Drafting the certificate", example: "Sick leave for 5 days for acute gastroenteritis." },
  { id: "rx", cat: "documentation", label: "Prescription draft", short: "Prescription", icon: NotepadText, desc: "A prescription in generic names for you to check and sign", placeholder: "Diagnosis, the patient's age, weight and allergies, and what to prescribe…", busy: "Drafting the prescription", example: "Uncomplicated UTI in a non-pregnant 30-year-old woman." },
  { id: "patient", cat: "documentation", label: "Patient education", short: "Patient info", icon: Users, desc: "Plain-language explainers patients understand", placeholder: "Topic to explain, e.g. starting insulin", busy: "Writing the explainer", example: "Explain starting insulin to a newly diagnosed patient." },
  { id: "research", cat: "learning", label: "Deep research", short: "Research", icon: Telescope, desc: "A structured, guideline-aware evidence review", placeholder: "Research question, e.g. SGLT2 inhibitors in HFpEF", busy: "Reviewing the evidence", example: "Current evidence for SGLT2 inhibitors in HFpEF." },
  { id: "viva", cat: "learning", label: "Viva practice", short: "Viva", icon: MessageCircleQuestion, desc: "An examiner asks one question at a time, then scores you", placeholder: "Topic for your viva, e.g. heart failure", busy: "The examiner is thinking", example: "Viva on diabetic ketoacidosis." },
  { id: "osce", cat: "learning", label: "OSCE history station", short: "OSCE", icon: UserRound, desc: "Take a history from a simulated patient, then get scored", placeholder: "Station, e.g. chest pain, or leave it to Cadus", busy: "The patient is answering", example: "Chest pain history station." },
  { id: "mcq", cat: "learning", label: "Exam MCQs", short: "MCQs", icon: GraduationCap, desc: "NEET-PG and USMLE-style practice questions", placeholder: "Topic for 5 practice questions, e.g. nephrotic syndrome", busy: "Writing questions", example: "Five NEET-PG questions on nephrotic syndrome." },
  { id: "slides", cat: "learning", label: "Lecture slides", short: "Slides", icon: Presentation, desc: "A complete teaching deck, ready to present", placeholder: "Deck topic, e.g. acute coronary syndrome for MBBS", busy: "Designing your deck", example: "Acute coronary syndrome for final-year MBBS." },
  { id: "evidence", cat: "learning", hidden: true, label: "Evidence summary", short: "Evidence", icon: BookOpenText, desc: "A cited summary of the PubMed papers you selected", placeholder: "Ask about these papers…", busy: "Summarising the evidence", example: "Summarise the papers selected in Research." },
];
const MODE = Object.fromEntries(MODES.map((m) => [m.id, m])) as Record<ModeId, ModeDef>;
const TOOL_MODES = MODES.filter((m) => m.id !== "general" && !m.hidden);

const GROUPS: { label: string; ids: ModeId[] }[] = [
  { label: "Clinical", ids: ["ddx", "drugs", "dosage", "labs", "image", "procedure"] },
  { label: "Documentation", ids: ["soap", "admission", "progress", "handover", "referral", "discharge", "opnote", "death", "certificate", "rx", "patient"] },
  { label: "Learning and research", ids: ["viva", "osce", "mcq", "research", "slides"] },
];

const TOOL_TABS: { id: ToolTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "clinical", label: "Clinical" },
  { id: "documentation", label: "Documentation" },
  { id: "learning", label: "Learning" },
];

const QUICK: ModeId[] = ["ddx", "drugs", "labs", "slides", "mcq"];
/** Home page quick actions for each kind of user. */
const QUICK_BY_ROLE: Record<ProfileRole, ModeId[]> = {
  student: ["viva", "mcq", "slides", "ddx", "labs"],
  aspirant: ["mcq", "viva", "ddx", "labs", "research"],
  intern: ["admission", "progress", "ddx", "drugs", "discharge"],
  resident: ["progress", "ddx", "handover", "referral", "research"],
  doctor: ["ddx", "drugs", "rx", "certificate", "referral"],
  nurse: ["drugs", "dosage", "patient", "labs", "procedure"],
  pharmacist: ["drugs", "dosage", "patient", "labs", "research"],
};
/** Role-play tools: no safety review, no source search, no profile tailoring and no privacy masking. */
const ROLEPLAY = new Set<ModeId>(["viva", "osce"]);

const EXAMPLES: { mode: ModeId; text: string }[] = [
  { mode: "ddx", text: "45-year-old man, crushing chest pain for 2 hours, diaphoretic, BP 90/60. Differentials and next step?" },
  { mode: "drugs", text: "Clarithromycin with atorvastatin and amlodipine: any clinically relevant interactions?" },
  { mode: "labs", text: "Na 128, K 5.9, glucose 62 mg/dL and a low morning cortisol. What is the pattern?" },
];

const FOLLOW: Record<ModeId, { text: string; mode?: ModeId }[]> = {
  general: [{ text: "Explain that in more depth" }, { text: "Summarise it in three key points" }, { text: "What do current guidelines recommend?" }],
  ddx: [{ text: "Which investigations would confirm the top diagnosis?" }, { text: "Outline the initial management plan" }, { text: "Which red flags need urgent referral?" }],
  drugs: [{ text: "Suggest safer alternatives" }, { text: "How should the patient be monitored?" }, { text: "Explain the mechanism simply" }],
  dosage: [{ text: "Adjust this for renal impairment" }, { text: "What is the paediatric dose?" }, { text: "Which parameters should be monitored?" }],
  labs: [{ text: "What further tests would you order?" }, { text: "What are the most likely causes?" }, { text: "Explain these results to the patient", mode: "patient" }],
  image: [{ text: "What are the main differentials?" }, { text: "Which view or test would help next?" }, { text: "Summarise the key findings" }],
  procedure: [{ text: "List the common complications and how to manage them" }, { text: "What should I cover when taking consent?" }, { text: "Turn this into a checklist" }],
  soap: [{ text: "Shorten this into a handover note" }, { text: "Suggest an assessment and plan" }, { text: "Convert it into a referral letter" }],
  handover: [{ text: "Shorten it to a 30-second version" }, { text: "Write the referral letter for this case", mode: "referral" }, { text: "List today's jobs for this patient as a checklist" }],
  referral: [{ text: "Make it more concise" }, { text: "Add the key investigations as a table" }, { text: "Explain the plan to the patient", mode: "patient" }],
  viva: [],
  osce: [],
  discharge: [{ text: "Rewrite it in patient-friendly language", mode: "patient" }, { text: "List the follow-up appointments needed" }, { text: "Shorten it for the GP letter" }],
  patient: [{ text: "Make it a bilingual handout in English and Hindi, section by section" }, { text: "Make it even simpler" }, { text: "Add a short FAQ section" }],
  admission: [{ text: "List today's jobs for this patient as a checklist" }, { text: "Turn this into an SBAR for the ward round", mode: "handover" }, { text: "Which differentials must I not miss?", mode: "ddx" }],
  progress: [{ text: "Shorten it for the handover", mode: "handover" }, { text: "Which investigations or reviews are due?" }, { text: "Explain today's plan to the family", mode: "patient" }],
  opnote: [{ text: "Write the post-operative orders" }, { text: "Which complications should we watch for in the first 48 hours?" }, { text: "Draft the discharge summary", mode: "discharge" }],
  death: [{ text: "Fill in the MCCD (Form 4) cause-of-death section" }, { text: "Check the cause-of-death sequence for errors" }, { text: "Help me prepare to speak with the family" }],
  certificate: [{ text: "Make it a fitness-to-resume-work certificate" }, { text: "Make it more formal" }, { text: "Translate it into Hindi" }],
  rx: [{ text: "Check these medicines for interactions", mode: "drugs" }, { text: "Explain the medicines to the patient", mode: "patient" }, { text: "Adjust the doses for kidney impairment", mode: "dosage" }],
  evidence: [{ text: "Which of these studies is strongest, and why?" }, { text: "What should change in practice in India?" }, { text: "Outline a journal club presentation on these papers" }],
  research: [{ text: "Summarise this in five key points" }, { text: "What changed in the latest guidelines?" }, { text: "Turn this into practice questions", mode: "mcq" }],
  mcq: [{ text: "Give me five harder questions" }, { text: "Explain the answers in more depth" }, { text: "Make a lecture deck on this topic", mode: "slides" }],
  slides: [{ text: "Create five MCQs on this topic", mode: "mcq" }, { text: "Summarise this topic in key points", mode: "general" }, { text: "Make a shorter deck for a different audience" }],
};

const STYLES: { id: StyleId; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "concise", label: "Quick", desc: "Short, focused answers", icon: Zap },
  { id: "balanced", label: "Balanced", desc: "The right depth for most questions", icon: Scale },
  { id: "detailed", label: "Thorough", desc: "Longer answers with more nuance", icon: Layers },
];

const ANSWER_MODES: { id: AnswerModeId; label: string; desc: string; icon: LucideIcon }[] = [
  { id: "auto", label: "Auto", desc: "Picks the right depth for each question", icon: Sparkles },
  { id: "fast", label: "Fast", desc: "Quick, to-the-point answers", icon: Zap },
  { id: "think", label: "Think", desc: "Reasons step by step for complex cases", icon: Lightbulb },
  { id: "exam", label: "Exam", desc: "High-yield facts, traps, one-liners and MCQs", icon: GraduationCap },
  { id: "simple", label: "Simple", desc: "Plain words and analogies, for anyone", icon: MessageCircle },
  { id: "deep", label: "Deep Dive", desc: "Researches PubMed and guidelines in steps, then writes a cited report", icon: Telescope },
];
const AMODE = Object.fromEntries(ANSWER_MODES.map((m) => [m.id, m])) as Record<AnswerModeId, (typeof ANSWER_MODES)[number]>;
const TONES: { id: ToneId; label: string; desc: string }[] = [
  { id: "professional", label: "Professional", desc: "Precise, like a senior colleague" },
  { id: "friendly", label: "Friendly", desc: "Warm and encouraging" },
  { id: "mentor", label: "Mentor", desc: "Teaches the why, then checks you" },
];
/** Tools whose answers get follow-ups written for them by the AI (the others keep their own suggestions). */
const SMART_FOLLOW = new Set<ModeId>(["general", "ddx", "drugs", "dosage", "labs", "image", "procedure", "research", "evidence"]);
/** Icons a Cadus Crew assistant can show. */
const CREW_ICON: Record<CrewIcon, LucideIcon> = {
  stethoscope: Stethoscope, graduation: GraduationCap, pill: Pill, file: FileText, microscope: Microscope, heart: HeartPulse,
  baby: Baby, brain: Brain, users: Users, clipboard: ClipboardList, siren: Siren, book: BookOpen,
  scan: ScanLine, scalpel: Scissors, shield: Shield, bone: Bone,
  eye: Eye, ear: Ear, droplets: Droplets, zap: Zap, syringe: Syringe, globe: Globe, sun: Sun,
};
/** A Crew assistant's badge. */
function CrewBadge({ c, size = 40 }: { c: Pick<CrewMember, "icon" | "tone"> & { avatar?: string }; size?: number }) {
  const I = CREW_ICON[c.icon] ?? Stethoscope;
  if (c.avatar) return <span className={`cx-crew-badge tone-${c.tone} cx-crew-av`} style={{ width: size, height: size, fontSize: Math.round(size * (/\p{Extended_Pictographic}/u.test(c.avatar) ? 0.5 : 0.38)) }} aria-hidden="true" data-avatar={c.avatar}>{c.avatar}</span>;
  return <span className={`cx-crew-badge tone-${c.tone}`} style={{ width: size, height: size }} aria-hidden="true"><I size={Math.round(size * 0.48)} /></span>;
}

type ModelId = "medius" | "magnus";
/** The Cadus models users choose between. Medius runs the fast model, Magnus the deeper one. */
const MODELS: { id: ModelId; name: string; short: string; desc: string; icon: LucideIcon }[] = [
  { id: "medius", name: "Cadus Medius 3.1", short: "Medius 3.1", desc: "Fast, accurate answers for everyday clinical questions", icon: Gauge },
  { id: "magnus", name: "Cadus Magnus 3.6", short: "Magnus 3.6", desc: "Deeper reasoning for complex cases and research", icon: Brain },
];
const MODEL_DEF = Object.fromEntries(MODELS.map((m) => [m.id, m])) as Record<ModelId, (typeof MODELS)[number]>;

const ACCENTS = [
  { id: "navy", name: "Clinical navy", light: "#1F3F7A", dark: "#8DB4F5" },
  { id: "aethex", name: "Aethex teal", light: "#007A6C", dark: "#2DD4BF" },
  { id: "blue", name: "Hospital blue", light: "#1D4ED8", dark: "#60A5FA" },
  { id: "teal", name: "Clinical teal", light: "#0E8F84", dark: "#2DD4BF" },
  { id: "indigo", name: "Indigo", light: "#4F46E5", dark: "#818CF8" },
  { id: "emerald", name: "Emerald", light: "#047857", dark: "#34D399" },
  { id: "graphite", name: "Graphite", light: "#344054", dark: "#CBD5E1" },
];

/** The Read tool's image and report types (the server has a reading protocol for each). */
const READINGS: { id: string; label: string; hint: string }[] = [
  { id: "xray", label: "X-ray", hint: "Chest or skeletal X-ray, read systematically" },
  { id: "ecg", label: "ECG", hint: "12-lead ECG or rhythm strip" },
  { id: "skin", label: "Skin", hint: "Dermatology photo" },
  { id: "ct", label: "CT / MRI", hint: "A CT or MRI slice" },
  { id: "usg", label: "Ultrasound", hint: "An ultrasound image" },
  { id: "fundus", label: "Eye", hint: "Fundus or anterior segment photo" },
  { id: "lab", label: "Lab report", hint: "A laboratory report (photo or PDF)" },
  { id: "rx", label: "Prescription", hint: "A prescription or medicine photo, checked like a pharmacist" },
];
const LANGUAGES = ["English", "Hindi", "Hinglish", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu"];

const SESSIONS_KEY = "cadus3.sessions";
const PREFS_KEY = "cadus3.prefs";
const USAGE_KEY = "cadus3.usage";
const LIBRARY_KEY = "cadus3.library";
const PROJECTS_KEY = "cadus3.projects";
const UI_KEY = "cadus3.ui";
const DOCS_KEY = "cadus3.docs";
const DEFAULT_PREFS: Prefs = { theme: "light", accent: "navy", textSize: "m", style: "balanced", language: "English", enterToSend: true, safetyReview: true, sources: false, answerFont: "sans", model: "medius", privacyGuard: true, notify: false, units: "conventional", nlem: false, density: "comfortable", wallpaper: "none", look: "editorial", answerMode: "auto", tone: "professional" };
/** Bumped when the default look changes, so saved settings move to the new theme, colour and answer font once. */
const PREFS_VERSION = 5;

function loadPrefs(): Prefs {
  const { v, ...saved } = readJSON<Partial<Prefs> & { v?: number }>(PREFS_KEY, {});
  if (v !== PREFS_VERSION) {
    delete saved.theme;
    delete saved.accent;
    delete saved.answerFont;
    delete saved.look;
  }
  const prefs = { ...DEFAULT_PREFS, ...saved };
  if (!isWallpaper(prefs.wallpaper)) prefs.wallpaper = "none";
  if (!LOOKS.some((l) => l.id === prefs.look)) prefs.look = "editorial";
  if (!ANSWER_MODES.some((m) => m.id === prefs.answerMode)) prefs.answerMode = "auto";
  if (!TONES.some((t) => t.id === prefs.tone)) prefs.tone = "professional";
  return prefs;
}
const PROJECT_IDEAS = ["Cardiology rotation", "NEET-PG revision", "Thesis literature review"];
const INSTRUCTIONS_MAX = 2000;

/** Other Aethex apps, shown in the sidebar's app launcher. */
const APPS: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Aethex home", path: "/", icon: House },
  { label: "Study Hub", path: "/study-hub", icon: GraduationCap },
  { label: "Medical books", path: "/books", icon: BookOpen },
  { label: "Flashcards", path: "/flashcards", icon: Layers },
  { label: "Shop", path: "/shop", icon: ShoppingBag },
];
/** Study content is reviewed by Haiku 5.5; clinical answers by Sonnet 5.5. */
const STUDY_MODES = new Set<ModeId>(["mcq", "research", "slides"]);

/* =============================================================== helpers */

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (key !== SESSIONS_KEY || !Array.isArray(value)) return;
    try {
      const slim = (value as Session[]).map((s, i) => (i < 3 ? s : {
        ...s,
        messages: s.messages.map((m) => ({ ...m, image: undefined, files: m.files?.map((f) => ({ ...f, data: undefined })) })),
      }));
      localStorage.setItem(key, JSON.stringify(slim));
    } catch { /* storage full */ }
  }
}

/** A chat as saved in this browser: PDFs are not kept (too large), nor are temporary chats. */
const storableSession = (s: Session): Session => ({
  ...s,
  messages: s.messages.map((m) => (m.files?.length ? { ...m, files: attachmentsForStorage(m.files) } : m)),
});

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? "⌘" : "Ctrl";

/** Whether the browser thinks it is online. */
function useOnline(): boolean {
  const [on, setOn] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const fn = () => setMatch(mq.matches);
    fn();
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, [query]);
  return match;
}

async function fileToDataUrl(file: File, max = 1568): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function relTime(t: number): string {
  const d = Date.now() - t;
  if (d < 60_000) return "Just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} min ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)} h ago`;
  return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const BACKUP_MODEL = "Cadus backup model";
const providerLabel = (p?: Provider) => (p === "library" ? "Cadus Medical Library" : p === "groq" ? BACKUP_MODEL : MODEL_DEF.medius.name);
/** The name users see for the model behind an answer. */
const modelLabel = (model?: string, provider?: Provider) =>
  provider === "library" ? "Cadus Medical Library"
  : provider === "groq" ? BACKUP_MODEL
  : model?.includes("sonnet") || model?.includes("opus") ? MODEL_DEF.magnus.name : MODEL_DEF.medius.name;
const LIBRARY_REASON: Record<string, string> = {
  credits: "the AI credits are used up",
  auth: "the AI key was rejected",
  missing: "no AI key is set",
};
const shortModel = (label: string) => label.replace(/^Cadus /, "");
const hostOf = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};
const safeSources = (list?: SourceRef[]) => (Array.isArray(list) ? list : []).filter((x) => x && typeof x.url === "string" && /^https?:\/\//.test(x.url));
const withSources = (text: string, list?: SourceRef[]) => {
  const src = safeSources(list);
  return src.length ? `${text}\n\nSources:\n${src.map((x) => `[${x.n}] ${x.title} - ${x.url}`).join("\n")}` : text;
};
const CONF_LABEL: Record<ReviewMeta["confidence"], string> = { high: "High confidence", moderate: "Moderate confidence", low: "Low confidence" };
/** "8 s" or "1 min 12 s": how long an answer took. */
const fmtTook = (ms?: number) => {
  if (!ms || ms < 0) return "";
  const sec = Math.max(1, Math.round(ms / 1000));
  return sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min ${sec % 60} s`;
};
/** Answers that read as documents, offered as a Canvas document. */
const DOC_MODES = new Set<ModeId>(["soap", "discharge", "referral", "handover", "patient", "admission", "progress", "opnote", "death", "certificate", "rx", "evidence"]);
const FEEDBACK_REASONS = ["Inaccurate or outdated", "Unsafe or missing a warning", "Not relevant to India", "Didn't follow my instructions", "Too long", "Not detailed enough"];

function pdfSafe(s: string): string {
  return s
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/[•●▪]/g, "-")
    .replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/×/g, "x")
    .replace(/[µμ]/g, "u").replace(/…/g, "...").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

/**
 * A PDF of an answer, a chat or a document. With a letterhead, the page starts
 * with your details instead of the Cadus band, and letters, certificates and
 * prescriptions end with a signature block.
 */
async function exportPdf(title: string, entries: { who: string; text: string }[], opts: { letterhead?: Letterhead | null; signature?: boolean } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 50;
  const lh = hasLetterhead(opts.letterhead) ? opts.letterhead : null;
  const dateText = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  let y: number;
  if (lh) {
    const lines = letterheadLines(lh);
    const top = 42;
    let x = M;
    if (lh.logo) {
      const h = 42;
      const w = Math.min(120, (h * lh.logo.w) / lh.logo.h);
      try {
        doc.addImage(lh.logo.data, /^data:image\/jpe?g/.test(lh.logo.data) ? "JPEG" : "PNG", M, top, w, h);
        x = M + w + 12;
      } catch { /* a logo that can't be drawn is left out */ }
    }
    let ly = top + 12;
    lines.left.forEach((t, i) => {
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.setFontSize(i === 0 ? 13 : 8.5);
      doc.setTextColor(i === 0 ? 15 : 75, i === 0 ? 23 : 85, i === 0 ? 41 : 99);
      doc.text(pdfSafe(t), x, ly);
      ly += i === 0 ? 14 : 11;
    });
    let ry = top + 12;
    lines.right.forEach((t, i) => {
      doc.setFont("helvetica", i === 0 ? "bold" : "normal");
      doc.setFontSize(i === 0 ? 10.5 : 8.5);
      doc.setTextColor(i === 0 ? 15 : 75, i === 0 ? 23 : 85, i === 0 ? 41 : 99);
      for (const part of doc.splitTextToSize(pdfSafe(t), (W - 2 * M) * 0.45) as string[]) {
        doc.text(part, W - M, ry, { align: "right" });
        ry += i === 0 ? 13 : 11;
      }
    });
    y = Math.max(ly, ry, top + 46) + 4;
    doc.setDrawColor(0, 122, 108);
    doc.setLineWidth(1.6);
    doc.line(M, y, W - M, y);
    y += 30;
  } else {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 74, "F");
    doc.setFillColor(29, 78, 216);
    doc.rect(0, 74, W, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Cadus", M, 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(160, 170, 184);
    doc.text("CLINICAL AI BY AETHEX", M + 64, 46);
    doc.text(new Date().toLocaleString("en-IN"), W - M, 46, { align: "right" });
    y = 114;
  }
  doc.setTextColor(16, 24, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  for (const line of doc.splitTextToSize(pdfSafe(title), W - 2 * M) as string[]) {
    doc.text(line, M, y);
    y += 18;
  }
  if (lh) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(dateText, M, y - 2);
    y += 10;
  }
  y += 8;
  for (const e of entries) {
    if (y > H - 100) { doc.addPage(); y = 60; }
    if (e.who) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(29, 78, 216);
      doc.text(e.who.toUpperCase(), M, y);
      y += 15;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(32, 40, 54);
    for (const line of doc.splitTextToSize(pdfSafe(markdownToText(e.text)), W - 2 * M) as string[]) {
      if (y > H - 64) { doc.addPage(); y = 60; }
      doc.text(line, M, y);
      y += 15;
    }
    y += 16;
  }
  if (opts.signature) {
    if (y > H - 150) { doc.addPage(); y = 80; }
    const sx = W - M - 200;
    y += 30;
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.8);
    doc.line(sx, y, W - M, y);
    y += 14;
    const sign = [
      [lh?.name || "Signature and seal", true],
      [lh?.qualifications || "", false],
      [lh?.registration || "Registration no. ____________", false],
      [`Date: ${dateText}`, false],
    ] as [string, boolean][];
    for (const [t, bold] of sign.filter(([t]) => t)) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 10.5 : 9);
      doc.setTextColor(bold ? 17 : 75, bold ? 24 : 85, bold ? 39 : 99);
      doc.text(pdfSafe(t), sx, y);
      y += 13;
    }
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 148, 160);
    doc.text(opts.signature ? "Draft prepared with Cadus. Check every detail before signing." : "AI-generated clinical decision support. Verify independently before use.", M, H - 30);
    doc.text(`${i} / ${pages}`, W - M, H - 30, { align: "right" });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "consultation";
  doc.save(`cadus-${slug}.pdf`);
}

function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function invokeCadus(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await invokeAi("cadus", { body });
  if (error) {
    let detail = "";
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") detail = (await ctx.json())?.error ?? "";
    } catch { /* ignore */ }
    throw new Error(detail || error.message || "Request failed");
  }
  if (data?.error) throw new Error(String(data.error));
  return data;
}

function friendlyError(raw: string): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "You're offline. Reconnect to ask Cadus; calculators, your ward list, cases and saved answers still work.";
  // PubMed's own messages (busy, unreachable) are already plain.
  if (/PubMed/.test(raw)) return raw;
  if (/fetch|network|Failed to send|load failed/i.test(raw)) return "Couldn't reach Cadus. Check your connection and try again.";
  if (/No AI key|not configured/i.test(raw)) return "Cadus isn't configured yet. The site owner needs to add the AI key in Cloudflare.";
  if (/rate|busy|429/i.test(raw)) return "Cadus is busy right now. Please try again in a moment.";
  return raw || "Something went wrong. Please try again.";
}

/** The main mode of a chat: the first specialised tool the user picked in it. */
function sessionMode(s: Session): ModeId {
  const m = s.messages.find((x) => x.role === "user" && x.mode !== "general") ?? s.messages.find((x) => x.role === "user");
  return m && MODE[m.mode] ? m.mode : "general";
}

/** Which sidebar filter a chat falls under. */
const sessionCat = (s: Session): ModeDef["cat"] => MODE[sessionMode(s)].cat;

/** Links to other Aethex apps must point at the main domain when Cadus runs on its own subdomain. */
const legalPath = (kind: "terms" | "privacy" | "disclaimer" | "about") => LEGAL_PATH(kind, isCadusHost());
/** Running inside the Cadus desktop app (its window tags the user agent). */
const IN_DESKTOP_APP = typeof navigator !== "undefined" && /CadusDesktop\//.test(navigator.userAgent);
const appHref = (path: string) => (!isCadusHost() ? path : mainUrl(path));

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 2).trimEnd()}…` : flat;
};

/* ======================================================== library mode */

const SOURCE_LONG: Record<string, string> = { w: "Wikipedia", m: "NIH health pages", d: "the Human Disease Ontology" };

interface LibraryRequest {
  userMsg: Msg;
  hist: { role: string; content: string }[];
  reason: string;
  draftBody: Record<string, unknown>;
  style: StyleId;
  language: string;
  instructions: string;
}

/**
 * Library mode: Claude has no credits (or no valid key), so answer from the offline
 * Cadus Medical Library: the retrieved passages are quoted directly.
 */
async function answerFromLibrary(req: LibraryRequest): Promise<Msg> {
  const { userMsg, hist, reason } = req;
  const base = { id: uid(), role: "assistant" as const, mode: userMsg.mode, at: Date.now() };
  const why = LIBRARY_REASON[reason] ?? "the AI is unavailable";
  const manifest = await medicalLibrary.manifest();
  if (!manifest) throw new Error("AI credits are used up and the offline medical library isn't installed yet.");
  const prev = [...hist].reverse().find((m) => m.role === "user")?.content;
  const followUp = !!prev && queryTerms(userMsg.content).length < 5;
  let result: LibraryResult = { terms: [], articles: [], passages: [], missing: [] };
  try {
    result = await medicalLibrary.search(userMsg.content, { context: followUp ? prev : undefined });
  } catch { /* treated as no match */ }
  if (!result.passages.length) {
    return {
      ...base, provider: "library",
      content: `${libraryNotFound(userMsg.content)}\n\n${libraryFootnote("extract", [])}`,
      library: { mode: "extract", reason, articles: 0 },
    };
  }
  const names = [...new Set(result.articles.map((a) => SOURCE_LONG[a.source] ?? "the library"))];
  // Quoted straight from the library: with the AI unavailable there is no model to write it.
  const content = composeFromLibrary(userMsg.content, result);
  const mode = "extract" as const;
  return {
    ...base,
    content: `${content}\n\n${libraryFootnote(mode, names)}`,
    provider: "library",
    sources: result.articles.filter((a) => a.url).map((a) => ({ n: a.n, url: a.url, title: `${a.title} · ${SOURCE_SHORT[a.source] ?? "Library"}` })),
    library: { mode, reason: why, articles: result.articles.length },
  };
}

/** The answer-history record for an answer (or a stopped or failed one). */
function auditEntry(sid: string, q: Msg, a: Msg): AuditEntry {
  const reviewed = !!a.review;
  const corrected = reviewed && (a.review!.verdict === "corrected" || a.review!.changes.length > 0);
  return {
    id: a.id,
    at: a.at,
    sid,
    mid: a.id,
    mode: q.mode,
    question: (q.content || "").replace(/\s+/g, " ").trim().slice(0, 160),
    status: a.error ? "error" : a.stopped ? "stopped" : a.library ? "library" : reviewed ? (corrected ? "corrected" : "approved") : "unreviewed",
    model: a.library ? (a.library.mode === "llm" ? BACKUP_MODEL : "Cadus Medical Library") : a.error || a.stopped ? modelLabel(undefined, undefined) : modelLabel(a.model, a.provider),
    ...(reviewed ? { reviewer: modelLabel(a.review!.model, a.review!.provider), confidence: a.review!.confidence } : {}),
    changes: a.review?.changes ?? [],
    sources: safeSources(a.sources).length,
    hidden: q.privacy?.total ?? 0,
    ...(a.took ? { ms: a.took } : {}),
    ...(q.think ? { think: true } : {}),
    ...(q.files?.length ? { files: q.files.length } : {}),
  };
}

/** The last two questions in a chat, so a follow-up still matches the protocol it is about. */
const hist0 = (history: Msg[]) => history.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join("\n").slice(0, 600);

/* ================================================================= page */

export default function CadusAI() {
  const { user, logout } = useUserAuth();
  const plan: PlanId = planOf(user);
  const limits = limitsOf(plan);
  const isPro = plan === "professional" || plan === "enterprise";
  const plansHref = isCadusHost() ? "/plans" : "/ai-assistant/plans";
  // Cadus asks for an account first: without one, the sign-in page.
  const gated = !user;
  const systemDark = useMedia("(prefers-color-scheme: dark)");
  const isDesktop = useMedia("(min-width: 900px)");
  const narrowDesk = useMedia("(max-width: 1599px)");
  const online = useOnline();

  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [sessions, setSessions] = useState<Session[]>(() =>
    readJSON<Session[]>(SESSIONS_KEY, []).filter((s) => s && typeof s.id === "string" && Array.isArray(s.messages)),
  );
  const [library, setLibrary] = useState<SavedItem[]>(() => readJSON<SavedItem[]>(LIBRARY_KEY, []).filter((x) => x && x.id));
  const [projects, setProjects] = useState<Project[]>(() =>
    readJSON<Project[]>(PROJECTS_KEY, []).filter((p) => p && typeof p.id === "string" && typeof p.name === "string"),
  );
  const [collapsed, setCollapsed] = useState<boolean>(() => !!readJSON<{ collapsed?: boolean }>(UI_KEY, {}).collapsed);
  const [moreOpen, setMoreOpen] = useState<boolean>(() => !!readJSON<{ moreOpen?: boolean }>(UI_KEY, {}).moreOpen);
  const [openGroups, setOpenGroups] = useState<string[]>(() => { const g = readJSON<{ groups?: unknown }>(UI_KEY, {}).groups; return Array.isArray(g) ? g.filter((x): x is string => typeof x === "string").slice(0, 1) : []; });
  const [moreQ, setMoreQ] = useState("");
  const [view, setView] = useState<View>("chat");
  const [projectId, setProjectId] = useState("");
  const [chatFilter, setChatFilter] = useState<ToolTab>("all");
  const [chatSearch, setChatSearch] = useState<string | null>(null);
  const [moveFor, setMoveFor] = useState("");
  const [projectDialog, setProjectDialog] = useState<{ id?: string; name: string; instructions: string; moveSession?: string } | null>(null);
  const [confirmProjectDelete, setConfirmProjectDelete] = useState(false);
  const [libInfo, setLibInfo] = useState<LibraryManifest | null | undefined>(undefined);
  const [libTestQ, setLibTestQ] = useState("");
  const [libTest, setLibTest] = useState<{ q: string; busy: boolean; hits: { title: string; source: string; url: string }[] } | null>(null);
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<ModeId>("general");
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pending, setPending] = useState<{
    id: string; sid: string; mode: ModeId; image: boolean; doc: boolean; stage: "draft" | "review" | "library";
    search: boolean; review: boolean; think: boolean; started: number; prior?: Msg;
    /** Deep Dive: the stages so far. */
    deep?: DeepStep[];
  } | null>(null);
  const [lastProvider, setLastProvider] = useState<Provider>("claude");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pop, setPop] = useState<string | null>(null);
  const [rowPos, setRowPos] = useState<{ top: number; left: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; text: string; where: "side" | "top" } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palQuery, setPalQuery] = useState("");
  const [palIndex, setPalIndex] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [upgrade, setUpgrade] = useState<{ reason: string; feature: "questions" | "sources" | "magnus" | "reading" | "prescriber" | "institution" | "mocks" } | null>(null);
  const [deck, setDeck] = useState<PresentationData | null>(null);
  const [toolTab, setToolTab] = useState<ToolTab>("all");
  const [libQuery, setLibQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState("");
  const [copied, setCopied] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [usage, setUsage] = useState(() => {
    const u = readJSON(USAGE_KEY, { date: today(), count: 0 });
    return u.date === today() ? u : { date: today(), count: 0 };
  });
  const [profile, setProfile] = useState<MedicalProfile | null>(readProfile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [practice, setPracticeState] = useState<PracticeState>(readPractice);
  const [learn, setLearnState] = useState<LearnState>(readLearn);
  const [toolsInit, setToolsInit] = useState<{ calc?: string; tab?: ToolsTab; drugs?: string[]; key: number }>({ key: 0 });
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [wardLang, setWardLang] = useState("");
  const [personal, setPersonalState] = useState<Personal>(readPersonal);
  // The Cadus mode stays as picked, like Grok's; "Think deeper" is the Think mode.
  const think = prefs.answerMode === "think";
  const setThink = (v: boolean | ((cur: boolean) => boolean)) =>
    setPrefs((p) => {
      const next = typeof v === "function" ? v(p.answerMode === "think") : v;
      return { ...p, answerMode: next ? "think" : p.answerMode === "think" ? "auto" : p.answerMode };
    });
  /** Cadus Crew: the user's own assistants, the one a new chat will be with, and the one being edited. */
  const [crewMine, setCrewMine] = useState<CrewMember[]>(() => readCrew(MODES.map((m) => m.id)));
  const [crewFav, setCrewFav] = useState<string[]>(readFav);
  const [crewUse, setCrewUse] = useState(readUse);
  const [crewQ, setCrewQ] = useState("");
  const [crewFilter, setCrewFilter] = useState<CrewFilter>("all");
  const [crewSort, setCrewSort] = useState<CrewSort>("default");
  const [crewFind, setCrewFind] = useState("");
  const [crewInsightsOpen, setCrewInsightsOpen] = useState(false);
  /** Update 35: per-assistant answer style, collections and notes, team packs. */
  const [crewStyles, setCrewStyles] = useState(readStyles);
  const [crewOrg, setCrewOrg] = useState<CrewOrg>(readOrg);
  const [crewSettings, setCrewSettings] = useState<CrewMember | null>(null);
  const [crewCol, setCrewCol] = useState("");
  const [packsOpen, setPacksOpen] = useState(false);
  const [packIncoming, setPackIncoming] = useState<ReadPack | null>(null);
  /** Update 36: assistant memory, ratings and the improve dialog. */
  const [crewMemory, setCrewMemory] = useState<Record<string, CrewFact[]>>(readMemory);
  const [crewRatings, setCrewRatings] = useState<Record<string, CrewRating[]>>(readRatings);
  const [crewImprove, setCrewImprove] = useState<CrewMember | null>(null);
  /** Update 37: notes and flashcards, check-ins, handoff. */
  const [crewNotes, setCrewNotes] = useState<CrewNotes>(readNotes);
  const [crewCheckins, setCrewCheckins] = useState<CheckIns>(readCheckins);
  const [handoffFrom, setHandoffFrom] = useState<CrewMember | null>(null);
  const [templatesCrew, setTemplatesCrew] = useState("");
  /** Update 39: workspaces and fact-check. */
  const [crewWs, setCrewWs] = useState<CrewWorkspaces>(readWorkspaces);
  const [factCheck, setFactCheck] = useState<{ question: string; answer: string } | null>(null);
  /** Update 40: translations, share cards and schedules. */
  const [translateMsg, setTranslateMsg] = useState<string | null>(null);
  const [shareCard, setShareCard] = useState<{ title: string; text: string; by: string; tone: string } | null>(null);
  const [crewSchedules, setCrewSchedules] = useState<CrewSchedule[]>(readSchedules);
  const [schedNow, setSchedNow] = useState(() => new Date());
  const [secondPick, setSecondPick] = useState("");
  useEffect(() => saveFav(crewFav), [crewFav]);
  useEffect(() => saveStyles(crewStyles), [crewStyles]);
  useEffect(() => saveOrg(crewOrg), [crewOrg]);
  useEffect(() => saveMemory(crewMemory), [crewMemory]);
  useEffect(() => saveRatings(crewRatings), [crewRatings]);
  useEffect(() => saveNotes(crewNotes), [crewNotes]);
  useEffect(() => saveCheckins(crewCheckins), [crewCheckins]);
  useEffect(() => saveWorkspaces(crewWs), [crewWs]);
  useEffect(() => saveSchedules(crewSchedules), [crewSchedules]);
  useEffect(() => { const t = window.setInterval(() => setSchedNow(new Date()), 60000); return () => window.clearInterval(t); }, []);
  useEffect(() => saveUse(crewUse), [crewUse]);
  const [crewNext, setCrewNext] = useState("");
  const [crewEdit, setCrewEdit] = useState<CrewMember | null>(null);
  /** Sharing and importing assistants, @mentions in the composer, and the huddle's first picks. */
  const [crewShare, setCrewShare] = useState<CrewMember | null>(null);
  const [crewImport, setCrewImport] = useState<CrewMember | null>(null);
  const [mention, setMention] = useState<CrewMember | null>(null);
  const [atMenu, setAtMenu] = useState<{ q: string; i: number } | null>(null);
  const [huddleInit, setHuddleInit] = useState<string[] | undefined>(undefined);
  /** An answer sent to Flashcards ("Make flashcards"). */
  const [cardSeed, setCardSeed] = useState<{ title: string; text: string } | null>(null);
  /** The Read tool: what kind of image or report is attached. */
  const [reading, setReading] = useState("");
  const [tempNext, setTempNext] = useState(false);
  const [versionView, setVersionView] = useState<Record<string, number>>({});
  const [fb, setFb] = useState<{ id: string; reasons: string[]; comment: string } | null>(null);
  const [docs, setDocs] = useState<CanvasDoc[]>(() =>
    readJSON<CanvasDoc[]>(DOCS_KEY, []).filter((d) => d && typeof d.id === "string" && typeof d.text === "string").map((d) => ({ ...d, history: Array.isArray(d.history) ? d.history : [] })),
  );
  const [canvasId, setCanvasId] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voicePersona, setVoicePersona] = useState<VoicePersona | undefined>(undefined);
  const [dragDepth, setDragDepth] = useState(0);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [libTab, setLibTab] = useState<"saved" | "docs">("saved");
  const [elapsed, setElapsed] = useState(0);
  const [deleteArmed, setDeleteArmed] = useState(0);
  const [lightbox, setLightbox] = useState("");
  const [dlFor, setDlFor] = useState("");
  const [letterhead, setLetterhead] = useState<Letterhead>(readLetterhead);
  const [institution, setInstitution] = useState<Institution>(readInstitution);
  const [cases, setCases] = useState<PatientCase[]>(readCases);
  const [caseOpen, setCaseOpen] = useState("");
  const [shareItem, setShareItem] = useState<Shared | null>(null);
  const [drugsInit, setDrugsInit] = useState<{ tab?: "reference" | "prescriber"; query?: string; key: number }>({ key: 0 });
  const [researchInit, setResearchInit] = useState<{ tab?: ResearchTab; query?: string; key: number }>({ key: 0 });
  const [homeQuery, setHomeQuery] = useState("");
  const [wardInfo, setWardInfo] = useState(() => readWard());
  const [readingCount, setReadingCount] = useState(() => readReading().length);
  const [audit, setAudit] = useState<AuditEntry[]>(readAudit);
  // Another tab added to (or cleared) the answer history.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === AUDIT_KEY || e.key === null) setAudit(readAudit()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // First run: welcome and setup, unless this browser already has a profile from before.
  const [onboardOpen, setOnboardOpen] = useState(() => !readFlag(ONBOARD_KEY) && !readProfile());
  const [tourOpen, setTourOpen] = useState(false);
  /** The answer whose sources are open beside the chat, and the source to highlight. */
  const [sourcesFor, setSourcesFor] = useState<{ mid: string; n?: number } | null>(null);
  /** A citation badge being hovered or focused: its preview card. */
  const [citePrev, setCitePrev] = useState<{ mid: string; n: number; x: number; y: number; above: boolean } | null>(null);
  const citeTimer = useRef<number | undefined>(undefined);

  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const cancelled = useRef<Set<string>>(new Set());
  const toastTimer = useRef<number | undefined>(undefined);
  const composerRef = useRef<HTMLDivElement>(null);
  const [menuMax, setMenuMax] = useState(480);
  const streamStore = useRef(createTextStore()).current;
  const aborts = useRef(new Map<string, AbortController>());
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const atBottomRef = useRef(true);
  const lastHeight = useRef(0);
  const autoCollapsed = useRef(false);
  const scrollKey = useRef("");

  const dark = prefs.theme === "dark" || (prefs.theme === "system" && systemDark);
  const accent = ACCENTS.find((a) => a.id === prefs.accent) ?? ACCENTS[0];
  // The wallpaper is drawn in the accent colour, faint enough to read over.
  const wallpaper = useMemo(() => {
    const acc = dark ? accent.dark : accent.light;
    const ink = prefs.wallpaper === "mesh" ? `color-mix(in srgb, ${acc} ${dark ? 16 : 11}%, transparent)` : `color-mix(in srgb, ${acc} ${dark ? 22 : 15}%, transparent)`;
    return wallpaperCss(prefs.wallpaper, ink, dark);
  }, [prefs.wallpaper, accent, dark]);
  const active = sessions.find((s) => s.id === activeId);
  const messages = view === "chat" ? active?.messages ?? [] : [];
  const modeDef = MODE[mode];
  const examDays = daysToExam(profile);
  /** The letterhead, when one is switched on and filled in. */
  const lh = hasLetterhead(letterhead) ? letterhead : null;
  /** Units, formulary and state for the AI (nothing when they are the defaults). */
  const practicePrefs = practicePayload({ units: prefs.units, nlem: prefs.nlem, state: profile?.state });
  const badge = practitionerBadge(profile);
  const auditSummary = useMemo(() => auditStats(audit), [audit]);
  const ptot = totals(practice);
  const liveGuard = useMemo(
    () => (prefs.privacyGuard && !ROLEPLAY.has(mode) && input.trim().length > 3 ? deidentify(input) : null),
    [input, prefs.privacyGuard, mode],
  );
  const styleDef = STYLES.find((s) => s.id === prefs.style) ?? STYLES[1];
  const modelDef = MODEL_DEF[prefs.model] ?? MODEL_DEF.medius;
  // "Dr Ananya Rao" greets as Ananya: titles are skipped.
  const firstName = (user?.name || "").trim().split(/\s+/).filter((w) => !/^(dr|prof|mr|mrs|ms|miss|sr|smt|shri)\.?$/i.test(w))[0] || "";
  const serif = prefs.answerFont !== "sans";
  // Newsreader has a smaller x-height than the sans, so serif answers are set a little larger to read the same.
  const sansSize = prefs.textSize === "s" ? 14 : prefs.textSize === "l" ? 16.5 : 15.5;
  const fontSize = serif ? (prefs.textSize === "s" ? 15.5 : prefs.textSize === "l" ? 18.5 : 17) : sansSize;
  const isHome = view === "chat" && messages.length === 0;
  const showHeroComposer = isHome && isDesktop;
  const showDock = view === "chat" && !showHeroComposer;
  const project = projects.find((p) => p.id === projectId);
  const activeProject = active?.projectId ? projects.find((p) => p.id === active.projectId) : undefined;
  const listed = sessions.filter((s) => !s.temp && !s.archived);
  const archivedList = sessions.filter((s) => s.archived && !s.temp);
  const pinned = listed.filter((s) => s.pinned);
  const canvasDoc = docs.find((d) => d.id === canvasId);
  const docByMsg = useMemo(() => new Map(docs.filter((d) => d.msgId).map((d) => [d.msgId as string, d])), [docs]);
  const chatQuery = (chatSearch ?? "").trim().toLowerCase();
  const chatList = listed.filter(
    (s) =>
      !s.pinned &&
      (chatFilter === "all" || sessionCat(s) === chatFilter) &&
      (!chatQuery || s.title.toLowerCase().includes(chatQuery)),
  );
  const decks = useMemo(
    () =>
      sessions
        .filter((s) => !s.temp)
        .flatMap((s) => s.messages.filter((m) => m.deck?.slides?.length).map((m) => ({ s, m })))
        .sort((a, b) => b.m.at - a.m.at),
    [sessions],
  );
  const projectStats = useMemo(() => {
    const out: Record<string, { chats: number; last: number }> = {};
    for (const s of sessions) {
      if (!s.projectId || s.temp || s.archived) continue;
      const cur = out[s.projectId] ?? { chats: 0, last: 0 };
      out[s.projectId] = { chats: cur.chats + 1, last: Math.max(cur.last, s.updatedAt) };
    }
    return out;
  }, [sessions]);
  const sortedProjects = [...projects].sort(
    (a, b) => Math.max(b.updatedAt, projectStats[b.id]?.last ?? 0) - Math.max(a.updatedAt, projectStats[a.id]?.last ?? 0),
  );
  const homeHref = isCadusHost() ? mainUrl("/") : "/";
  const signInHref = isCadusHost() ? "/sign-in" : "/ai-assistant/sign-in";

  /* --------------------------------------------------------- effects */

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Cadus · Clinical AI by Aethex";
    const icons = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
    const prev = icons.map((l) => l.href);
    icons.forEach((l) => { l.href = CADUS_ICON_DATA_URL; });
    return () => {
      document.title = prevTitle;
      icons.forEach((l, i) => { l.href = prev[i]; });
      stopSpeaking();
    };
  }, []);

  useEffect(() => writeJSON(PREFS_KEY, { ...prefs, v: PREFS_VERSION }), [prefs]);
  useEffect(() => writeJSON(SESSIONS_KEY, sessions.filter((s) => !s.temp).slice(0, 100).map(storableSession)), [sessions]);
  useEffect(() => writeJSON(DOCS_KEY, docs.slice(0, 50).map((d) => ({ ...d, history: d.history.slice(-5) }))), [docs]);
  useEffect(() => savePersonal(personal), [personal]);
  useEffect(() => saveLetterhead(letterhead), [letterhead]);
  useEffect(() => saveInstitution(institution), [institution]);
  useEffect(() => saveCases(cases), [cases]);
  useEffect(() => {
    // Someone who set up a profile before the welcome existed doesn't need it.
    if (profile && !readFlag(ONBOARD_KEY)) setFlag(ONBOARD_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The ward list and reading list live in their own views; refresh the home page's view of them.
  useEffect(() => {
    setWardInfo(readWard());
    setReadingCount(readReading().length);
  }, [view]);
  // The sources panel and citation previews belong to the chat on screen.
  useEffect(() => {
    setSourcesFor(null);
    setCitePrev(null);
  }, [activeId, view]);
  // Canvas and the sources share the space beside the chat: opening a document closes the sources.
  useEffect(() => {
    if (canvasId) setSourcesFor(null);
  }, [canvasId]);
  // A temporary chat is discarded as soon as you leave it.
  useEffect(() => {
    setSessions((p) => (p.some((s) => s.temp && s.id !== activeId) ? p.filter((s) => !s.temp || s.id === activeId) : p));
  }, [activeId]);
  // Seconds since the question was sent, shown while Cadus works.
  const pendingStarted = pending?.started;
  useEffect(() => {
    if (!pendingStarted) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.round((Date.now() - pendingStarted) / 1000));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [pendingStarted]);
  useEffect(() => writeJSON(LIBRARY_KEY, library.slice(0, 300)), [library]);
  useEffect(() => writeJSON(USAGE_KEY, usage), [usage]);
  useEffect(() => writeJSON(PROJECTS_KEY, projects), [projects]);
  useEffect(() => saveCrew(crewMine), [crewMine]);
  useEffect(() => writeJSON(UI_KEY, { collapsed: autoCollapsed.current ? false : collapsed, moreOpen, groups: openGroups }), [collapsed, moreOpen, openGroups]);
  // Canvas needs room: on smaller desktop screens the sidebar folds away while it is open.
  useEffect(() => {
    if (canvasId && isDesktop && narrowDesk && !collapsed) {
      autoCollapsed.current = true;
      setCollapsed(true);
    } else if (!canvasId && autoCollapsed.current) {
      autoCollapsed.current = false;
      setCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId]);
  useEffect(() => savePractice(practice), [practice]);
  useEffect(() => saveLearn(learn), [learn]);
  useEffect(() => {
    if (view === "project" && !project) setView("projects");
  }, [view, project]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const key = `${view}:${activeId}`;
    const switched = scrollKey.current !== key;
    scrollKey.current = key;
    if (!messages.length) { el.scrollTo({ top: 0 }); return; }
    // An answer landing doesn't pull you down if you've scrolled up to read.
    if (!switched && messages[messages.length - 1]?.role === "assistant" && !atBottomRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: switched ? "auto" : "smooth" });
    atBottomRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, pending?.id, activeId, view]);

  /** Keep the answer in view as it streams in, unless you've scrolled up. */
  const followStream = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const before = (lastHeight.current || el.scrollHeight) - el.scrollTop - el.clientHeight;
    if (atBottomRef.current || before < 120) el.scrollTop = el.scrollHeight;
    lastHeight.current = el.scrollHeight;
  }, []);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(260, ta.scrollHeight)}px`;
  }, [input, showHeroComposer, view]);

  useEffect(() => {
    if (!pop) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest(`[data-pop="${pop}"]`)) {
        setPop(null);
        setConfirmDelete("");
        setMoveFor("");
        setDlFor("");
        setConfirmProjectDelete(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        setPalQuery("");
        setPalIndex(0);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        newChat();
        return;
      }
      if (voiceOpen) return;
      if (mod && e.shiftKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
        // Copy the last answer
        const last = [...messages].reverse().find((m) => m.role === "assistant" && !m.error);
        if (last) { e.preventDefault(); void copy(shownVersion(last)); }
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDesktop) setCollapsed((c) => !c);
        else setSidebarOpen((o) => !o);
        return;
      }
      if (mod && e.shiftKey && (e.key === "Backspace" || e.key === "Delete") && view === "chat" && active) {
        e.preventDefault();
        if (Date.now() - deleteArmed < 4000) { setDeleteArmed(0); deleteSession(active.id); }
        else { setDeleteArmed(Date.now()); toast(`Press ${MOD} Shift Backspace again to delete this chat`); }
        return;
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        openSettings("shortcuts");
        return;
      }
      if (e.shiftKey && e.key === "Escape") {
        e.preventDefault();
        taRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (lightbox) setLightbox("");
        else if (paletteOpen) setPaletteOpen(false);
        else if (fb) setFb(null);
        else if (sourcesFor) setSourcesFor(null);
        else if (canvasDoc) closeCanvas();
        else if (profileOpen) setProfileOpen(false);
        else if (editing) setEditing(null);
        else if (projectDialog) setProjectDialog(null);
        else if (settingsOpen) setSettingsOpen(false);
        else if (pop) { setPop(null); setConfirmDelete(""); setMoveFor(""); setDlFor(""); setConfirmProjectDelete(false); }
        else if (renaming) setRenaming(null);
        else if (sidebarOpen) setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!settingsOpen) setConfirmClear(false);
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen && settingsTab === "data" && libInfo === undefined) void medicalLibrary.manifest().then(setLibInfo);
  }, [settingsOpen, settingsTab, libInfo]);

  const runLibraryTest = async () => {
    const q = libTestQ.trim();
    if (!q) return;
    setLibTest({ q, busy: true, hits: [] });
    try {
      const r = await medicalLibrary.search(q, { maxArticles: 5, maxPassages: 5 });
      setLibTest({ q, busy: false, hits: r.articles.map((a) => ({ title: a.title, source: SOURCE_SHORT[a.source] ?? "Library", url: a.url })) });
    } catch {
      setLibTest({ q, busy: false, hits: [] });
    }
  };

  const toast = (t: string) => {
    setToastMsg(t);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(""), 2400);
  };

  /* -------------------------------------------------------- sessions */

  const upsert = useCallback((sid: string, fn: (m: Msg[]) => Msg[], title?: string, inProject?: string, flags: Partial<Session> = {}) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sid);
      const base: Session = existing ?? { id: sid, title: title || "New chat", messages: [], updatedAt: Date.now(), ...(inProject ? { projectId: inProject } : {}), ...flags };
      const next: Session = { ...base, messages: fn(base.messages), updatedAt: Date.now() };
      return [next, ...prev.filter((s) => s.id !== sid)];
    });
  }, []);

  /* -------------------------------------------------------- Cadus Crew */

  const openCrew = () => { setView("crew"); setSidebarOpen(false); setPop(null); };
  /** A new chat with this Crew assistant: its starters on the home page, its instructions with every message. */
  const startCrew = (c: CrewMember) => {
    newChat();
    setCrewNext(c.id);
    setCrewUse((u) => recordUse(u, c.id));
  };
  const toggleFav = (id: string) => setCrewFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f]));
  /** Update 38: everything done with Crew, for the timeline. */
  const crewTimelineNow = () => buildTimeline({
    chats: sessions.filter((x) => x.crewId).map((x) => ({ at: x.updatedAt, title: x.title, crew: findCrew(x.crewId, crewMine)?.name ?? "an assistant" })),
    huddles: readHuddles(), debates: readDebates(), runs: readPlaybookRuns(), quiz: readQuizResults(), drill: readDrill(), rounds: readCaseRounds(), rooms: readRooms(),
    notes: crewNotes.notes, checkins: crewCheckins.history,
    crewName: (id) => findCrew(id, crewMine)?.name ?? "an assistant",
  });
  /** Everything Crew counts for stats and badges (all on this device). */
  const crewStatsNow = (): CrewStats => {
    const quiz = readQuizResults(), drill = readDrill();
    return {
      chats: sessions.filter((x) => x.crewId).length,
      assistantsUsed: new Set([...sessions.map((x) => x.crewId).filter(Boolean), ...Object.keys(crewUse)]).size,
      ownAssistants: crewMine.length,
      quizBattles: quiz.length,
      bestQuiz: quiz.reduce((m, r) => Math.max(m, ...r.players.map((pl) => pl.score)), 0),
      drillDays: Object.keys(drill.days).length,
      bestStreak: bestStreak(drill.days),
      caseRounds: readCaseRounds().length,
      roomMessages: readRooms().reduce((n, r) => n + r.messages.filter((m) => m.role === "user").length, 0),
      ratings: Object.values(crewRatings).reduce((n, l) => n + l.length, 0),
      facts: Object.values(crewMemory).reduce((n, l) => n + l.length, 0),
      notes: crewNotes.notes.length,
      cardsReviewed: crewNotes.reviewed,
      collections: crewOrg.collections.length,
      checkins: crewCheckins.history.length,
    };
  };
  /** A team pack (ready-made or built) saved as a collection. */
  const addPackCollection = (name: string, ids: string[]) => {
    if (!ids.length) return;
    if (crewOrg.collections.length >= 20 && !crewOrg.collections.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) { toast("You can keep up to 20 collections"); return; }
    setCrewOrg((o) => addCollection(o, name, ids));
    toast(`"${name.trim() || "Crew pack"}" is in your collections`);
  };
  /** A pack someone sent: their own assistants join as copies, and the whole team becomes a collection. */
  const importPack = (p: ReadPack) => {
    const room = Math.max(0, CREW_MAX - crewMine.length);
    const add = p.custom.slice(0, room);
    if (add.length) setCrewMine((l) => [...add, ...l]);
    setCrewOrg((o) => addCollection(o, p.name, [...p.builtInIds, ...add.map((c) => c.id)]));
    setPackIncoming(null);
    toast(`Added "${p.name}"${add.length ? `: ${add.length} new assistant${add.length === 1 ? "" : "s"} joined your crew` : ""}${p.custom.length > add.length ? ` (${p.custom.length - add.length} skipped: limit ${CREW_MAX})` : ""}`);
  };
  const exportCrew = () => {
    if (!crewMine.length) { toast("Create or import an assistant first"); return; }
    const blob = new Blob([exportCrewFile(crewMine)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cadus-crew-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(`Exported ${crewMine.length} assistant${crewMine.length === 1 ? "" : "s"}`);
  };
  const importCrew = async (f: File | undefined) => {
    if (!f) return;
    const list = importCrewFile(await f.text(), MODES.map((m) => m.id));
    if (!list.length) { toast("No assistants found in that file"); return; }
    const room = Math.max(0, CREW_MAX - crewMine.length);
    const add = list.slice(0, room);
    if (!add.length) { toast(`You can keep up to ${CREW_MAX} assistants`); return; }
    setCrewMine((l) => [...add, ...l]);
    toast(`Imported ${add.length} assistant${add.length === 1 ? "" : "s"}${list.length > add.length ? ` (${list.length - add.length} skipped: limit ${CREW_MAX})` : ""}`);
  };
  const saveCrewEdit = () => {
    if (!crewEdit) return;
    const clean = cleanCrew(crewEdit, MODES.map((m) => m.id));
    if (!clean) { toast("Give it a name and instructions"); return; }
    const exists = crewMine.some((c) => c.id === clean.id);
    if (!exists && crewMine.length >= CREW_MAX) { toast(`You can keep up to ${CREW_MAX} assistants`); return; }
    setCrewMine((l) => (exists ? l.map((c) => (c.id === clean.id ? clean : c)) : [clean, ...l]));
    setCrewEdit(null);
    toast(exists ? "Saved" : `${clean.name} joined your crew`);
  };
  /** Adds an imported assistant to your crew (a new copy, never replacing one). */
  const addImported = (c: CrewMember) => {
    if (crewMine.length >= CREW_MAX) { toast(`You can keep up to ${CREW_MAX} assistants`); return; }
    const clean = cleanCrew({ ...c, id: "", importedAt: Date.now() }, MODES.map((m) => m.id));
    if (!clean) return;
    setCrewMine((l) => [clean, ...l]);
    setCrewImport(null);
    setView("crew");
    toast(`${clean.name} joined your crew`);
  };
  const openHuddle = (ids?: string[]) => { setHuddleInit(ids); setView("huddle"); setSidebarOpen(false); setPop(null); };
  /** The @ picker in the composer: the assistants that match what's typed after "@". */
  const atList = atMenu ? matchCrew(atMenu.q, crewMine) : [];
  const pickMention = (c: CrewMember) => {
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart ?? input.length : input.length;
    const before = input.slice(0, caret).replace(/@[\p{L}\p{N}-]{0,30}$/u, "");
    setInput(before + input.slice(caret));
    setMention(c);
    setAtMenu(null);
    focusComposer();
  };
  const deleteCrew = (id: string) => {
    setCrewMine((l) => l.filter((c) => c.id !== id));
    if (crewNext === id) setCrewNext("");
    setPop(null);
    toast("Removed from your crew");
  };
  /** A new chat holding this chat up to the chosen answer, to take the conversation another way. */
  const branchFrom = (mid: string) => {
    if (!active || pending) return;
    const idx = active.messages.findIndex((x) => x.id === mid);
    if (idx < 0) return;
    const sid = uid();
    const copy: Session = {
      id: sid, title: clip(`Branch · ${active.title}`, 90), messages: active.messages.slice(0, idx + 1).map((x) => ({ ...x, id: uid() })), updatedAt: Date.now(),
      ...(active.projectId ? { projectId: active.projectId } : {}), ...(active.crewId ? { crewId: active.crewId } : {}),
      ...(active.caseId ? { caseId: active.caseId } : {}), ...(active.temp ? { temp: true } : {}),
    };
    setSessions((p) => [copy, ...p]);
    setActiveId(sid);
    setView("chat");
    setEditing(null);
    toast("Branched into a new chat");
    focusComposer();
  };

  /* -------------------------------------------------------- projects */

  const openProjects = () => {
    setView("projects");
    setSidebarOpen(false);
    setPop(null);
  };

  const openProject = (id: string) => {
    setProjectId(id);
    setView("project");
    setActiveId("");
    setInput("");
    setAttachments([]);
    setMode("general");
    setSidebarOpen(false);
    setPop(null);
    setConfirmProjectDelete(false);
  };

  const newProject = (moveSession?: string) => {
    setPop(null);
    setMoveFor("");
    setSidebarOpen(false);
    setProjectDialog({ name: "", instructions: "", moveSession });
  };

  const saveProjectDialog = () => {
    if (!projectDialog) return;
    const name = projectDialog.name.trim().slice(0, 60);
    if (!name) return;
    const instructions = projectDialog.instructions.trim().slice(0, INSTRUCTIONS_MAX);
    if (projectDialog.id) {
      const id = projectDialog.id;
      setProjects((p) => p.map((x) => (x.id === id ? { ...x, name, instructions, updatedAt: Date.now() } : x)));
      toast("Project updated");
    } else {
      const id = uid();
      setProjects((p) => [{ id, name, instructions, createdAt: Date.now(), updatedAt: Date.now() }, ...p]);
      if (projectDialog.moveSession) {
        const sid = projectDialog.moveSession;
        setSessions((p) => p.map((s) => (s.id === sid ? { ...s, projectId: id } : s)));
        toast(`Moved to ${clip(name, 32)}`);
      } else {
        openProject(id);
        focusComposer();
      }
    }
    setProjectDialog(null);
  };

  const deleteProject = (id: string) => {
    setProjects((p) => p.filter((x) => x.id !== id));
    setSessions((p) => p.map((s) => (s.projectId === id ? { ...s, projectId: undefined } : s)));
    setConfirmProjectDelete(false);
    setPop(null);
    setView("projects");
    toast("Project deleted. Its chats are still in your list.");
  };

  const moveToProject = (sid: string, pid?: string) => {
    setSessions((p) => p.map((s) => (s.id === sid ? { ...s, projectId: pid } : s)));
    setMoveFor("");
    setPop(null);
    const name = projects.find((x) => x.id === pid)?.name;
    toast(name ? `Moved to ${clip(name, 32)}` : "Removed from project");
  };

  const instructionsFor = (sid: string, pid?: string) => {
    const owner = pid ?? sessions.find((s) => s.id === sid)?.projectId;
    return owner ? projects.find((p) => p.id === owner)?.instructions || "" : "";
  };

  const focusComposer = () => window.setTimeout(() => taRef.current?.focus(), 60);

  function newChat(m: ModeId = "general") {
    setView("chat");
    setActiveId("");
    setInput("");
    setAttachments([]);
    setCrewNext("");
    setFb(null);
    setEditing(null);
    setMode(m);
    setSidebarOpen(false);
    setPop(null);
    focusComposer();
  }

  const openSession = (id: string) => {
    setView("chat");
    setActiveId(id);
    setSidebarOpen(false);
    setPop(null);
    setEditing(null);
    // A viva or OSCE chat carries on in its role-play mode; any other chat leaves it.
    const lastU = [...(sessions.find((x) => x.id === id)?.messages ?? [])].reverse().find((x) => x.role === "user");
    if (lastU && ROLEPLAY.has(lastU.mode)) setMode(lastU.mode);
    else setMode((cur) => (ROLEPLAY.has(cur) ? "general" : cur));
  };

  const deleteSession = (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    if (id === activeId) setActiveId("");
    setConfirmDelete("");
    setPop(null);
    toast("Chat deleted");
  };

  const togglePin = (id: string) => {
    setSessions((p) => p.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
    setPop(null);
  };

  const commitRename = () => {
    if (!renaming) return;
    const text = renaming.text.trim();
    if (text) setSessions((p) => p.map((s) => (s.id === renaming.id ? { ...s, title: text.slice(0, 90) } : s)));
    setRenaming(null);
  };

  const openRowMenu = (e: ReactMouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const key = `row:${id}`;
    if (pop === key) { setPop(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setRowPos({ top: Math.max(8, Math.min(r.bottom + 4, window.innerHeight - 330)), left: Math.max(8, Math.min(r.left - 6, window.innerWidth - 248)) });
    setConfirmDelete("");
    setMoveFor("");
    setDlFor("");
    setPop(key);
  };

  /* ------------------------------------------------------------ send */

  /** Replace a chat's first-message title with a short AI title (not for temporary or renamed chats). */
  const autoTitle = async (sid: string, question: string, answer: string) => {
    try {
      const r = await invokeCadus({ action: "title", message: (stripPlaceholders(question) || question).slice(0, 1500), answer: markdownToText(answer).slice(0, 800) });
      const t = typeof r?.title === "string" ? r.title.trim() : "";
      if (t) setSessions((p) => p.map((x) => (x.id === sid && x.autoTitle ? { ...x, title: t.slice(0, 90), autoTitle: false } : x)));
    } catch { /* keep the first-message title */ }
  };

  /** Follow-up questions written for this answer (the tool's own suggestions show until they arrive, or if they don't). */
  const suggestFollowups = async (sid: string, reply: Msg, q: Msg, language: string) => {
    try {
      const r = await invokeCadus({ action: "followups", question: (stripPlaceholders(q.content) || q.content).slice(0, 1500), answer: markdownToText(reply.content).slice(0, 2500), language });
      const list = Array.isArray(r?.followups) ? (r.followups as unknown[]).filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, 3) : [];
      if (list.length) setSessions((p) => p.map((s) => (s.id === sid ? { ...s, messages: s.messages.map((x) => (x.id === reply.id ? { ...x, followups: list } : x)) } : s)));
    } catch { /* keep the tool's own suggestions */ }
  };

  /** A desktop notification when an answer lands while Cadus is in a background tab. */
  const notifyDone = (sid: string, reply: Msg) => {
    if (!prefs.notify || typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState !== "hidden") return;
    try {
      const title = sessionsRef.current.find((x) => x.id === sid)?.title || "Your question";
      new Notification(reply.error ? "Cadus couldn't answer" : "Cadus answered", { body: clip(title, 90), icon: CADUS_ICON_DATA_URL, tag: sid });
    } catch { /* notifications blocked */ }
  };

  const runRequest = useCallback(
    async (
      sid: string, history: Msg[], userMsg: Msg, instructions = "",
      extra: { improve?: Record<string, unknown>; prior?: Msg; temp?: boolean; crew?: CrewMember } = {},
    ): Promise<Msg | null> => {
      const reqId = uid();
      const started = Date.now();
      const roleplay = ROLEPLAY.has(userMsg.mode);
      const search = !roleplay && (userMsg.mode === "research" || !!userMsg.search);
      const doReview = prefs.safetyReview && !roleplay;
      const project = instructions.trim() ? { instructions: instructions.trim() } : {};
      // The Crew assistant, the Cadus mode and the tone go with the draft and the review.
      const crewBody = crewPayload(extra.crew);
      const styled = {
        ...(crewBody ? { crew: crewBody } : {}),
        ...(userMsg.amode && userMsg.amode !== "deep" ? { answerMode: userMsg.amode } : {}),
        ...(userMsg.tone ? { tone: userMsg.tone } : {}),
      };
      // A message can ask for its own reply language (a patient explanation in Hindi, say).
      const language = userMsg.lang || prefs.language;
      const who = profilePayload(profile);
      // Temporary chats follow custom instructions but don't use memory.
      const mine = roleplay ? undefined : personalPayload(extra.temp ? { ...personal, useMemory: false } : personal);
      const tailored = { ...(who ? { profile: who } : {}), ...(mine ? { personal: mine } : {}) };
      // The institution's protocols that match this question (none in role-play).
      // A short follow-up ("and in children?") is matched with the questions before it.
      const followUp = contentWords(userMsg.content) < 2 || /^(and|also|what about|how about|if|then|but|same)\b/i.test(userMsg.content.trim());
      const inst = roleplay ? undefined : institutionPayload(institution, followUp ? `${userMsg.content}\n${hist0(history)}` : userMsg.content);
      let files = attachmentPayload(userMsg.files ?? []);
      const hasDoc = !!userMsg.files?.some((f) => f.kind !== "image");
      const hasImage = !!userMsg.image || !!userMsg.files?.some((f) => f.kind === "image");
      // Follow-up questions can refer to files attached earlier in the chat, as in ChatGPT and Claude.
      let filesEarlier = false;
      // PubMed records attached for an evidence summary are its numbered sources.
      let refs = userMsg.refs;
      if (!files.length && !userMsg.image && !roleplay && userMsg.mode !== "slides") {
        const earlier = [...history].reverse().find((m) => m.role === "user" && m.files?.some((f) => f.data));
        if (earlier?.files) {
          files = attachmentPayload(earlier.files);
          filesEarlier = files.length > 0;
          if (!refs?.length && earlier.refs?.length) refs = earlier.refs;
        }
      }
      const style = userMsg.voice ? "voice" : prefs.style;
      const controller = new AbortController();
      aborts.current.set(reqId, controller);
      streamStore.set("");
      const isDeep = userMsg.amode === "deep";
      setPending({ id: reqId, sid, mode: userMsg.mode, image: hasImage && !hasDoc, doc: hasDoc, stage: "draft", search, review: doReview, think: !!userMsg.think, started, prior: extra.prior, ...(isDeep ? { deep: [] } : {}) });
      setUsage((u) => (u.date === today() ? { ...u, count: u.count + 1 } : { date: today(), count: 1 }));
      const hist = history.filter((m) => !m.error && !m.stopped).slice(-16).map((m) => ({ role: m.role, content: m.content }));
      let reply: Msg;
      try {
        if (userMsg.mode === "slides") {
          const data = await invokeCadus({ action: "generate-slides", topic: userMsg.content, review: doReview, model: prefs.model, ...project });
          const d = data?.presentation as PresentationData | undefined;
          if (!d?.slides?.length) throw new Error("No slides were returned. Please try again.");
          reply = {
            id: uid(), role: "assistant", mode: "slides", at: Date.now(), deck: d, provider: data.provider, model: data.model,
            review: data.review ?? undefined,
            reviewNote: doReview && !data.review ? "The fact-check couldn't run for this deck. Review it before teaching." : undefined,
            content: `Your lecture deck **${d.title}** is ready: ${d.slides.length} slides covering ${d.subtitle || "the topic"}.`,
          };
        } else if (isDeep) {
          // Deep Dive: plan, search PubMed and guidelines step by step, then the cited report (streamed).
          let steps: DeepStep[] = [];
          const onStep = (st: DeepStep) => {
            steps = steps.some((x) => x.id === st.id) ? steps.map((x) => (x.id === st.id ? st : x)) : [...steps, st];
            setPending((p) => (p?.id === reqId ? { ...p, deep: steps } : p));
          };
          let done;
          try {
            done = await streamCadus({
              action: "deep-dive", message: userMsg.content, language, history: hist.slice(-6), ...project, ...tailored,
              ...(crewBody ? { crew: crewBody } : {}),
            }, { onDelta: (t) => streamStore.append(t), onReset: () => streamStore.set(""), onStep, signal: controller.signal });
          } catch (e) {
            if (e instanceof StreamUnavailable) throw new Error("Deep Dive needs a live connection to Cadus. Check your connection and try again.");
            throw e;
          }
          if (cancelled.current.has(reqId)) return null;
          if (!done?.message) throw new Error("Deep Dive returned an empty report. Please try again.");
          let content = String(done.message);
          const sources = safeSources(done.sources as SourceRef[] | undefined);
          streamStore.set(content);
          let review: ReviewMeta | undefined;
          let reviewNote: string | undefined;
          if (doReview) {
            setPending((p) => (p?.id === reqId ? { ...p, stage: "review" } : p));
            try {
              const rv = await invokeCadus({ action: "review", mode: "research", question: userMsg.content, draft: content, sources, language, ...project, ...tailored, ...(crewBody ? { crew: crewBody } : {}) });
              if (rv?.message) { content = String(rv.message); review = rv.review ?? undefined; }
              else reviewNote = "The safety review didn't return a result for this report. Check it carefully before relying on it.";
            } catch {
              reviewNote = "The safety review couldn't run for this report. Check it carefully before relying on it.";
            }
          }
          reply = {
            id: uid(), role: "assistant", mode: userMsg.mode, at: Date.now(), content,
            provider: done.provider as Provider | undefined, model: done.model,
            sources: sources.length ? sources : undefined, review, reviewNote,
            deep: { title: done.title, steps, papers: Number(done.papers) || 0, web: Number(done.web) || 0 },
          };
        } else {
          // Step 1: draft, streamed as it is written (optionally grounded in live, cited sources)
          const draftBody = {
            action: hasImage ? "analyze-image" : "chat",
            message: userMsg.content,
            image: userMsg.image,
            ...(userMsg.reading ? { reading: userMsg.reading } : {}),
            ...(files.length ? { files, ...(filesEarlier ? { filesEarlier: true } : {}) } : {}),
            mode: userMsg.mode,
            style,
            language,
            history: hist,
            search,
            // Cadus can answer from the offline medical library when the AI has no credits.
            library: true,
            model: prefs.model,
            ...(userMsg.think ? { think: true } : {}),
            ...(extra.improve ? { improve: extra.improve } : {}),
            ...project,
            ...styled,
            ...tailored,
            ...(practicePrefs && !roleplay ? { practice: practicePrefs } : {}),
            ...(inst ? { institution: inst.payload } : {}),
          };
          let draft: any;
          try {
            draft = await streamCadus(draftBody, {
              onDelta: (t) => streamStore.append(t),
              onReset: () => streamStore.set(""),
              signal: controller.signal,
            });
          } catch (e) {
            if (!(e instanceof StreamUnavailable)) throw e;
            draft = await invokeCadus(draftBody);
          }
          if (cancelled.current.has(reqId)) return null;
          if (draft?.libraryMode) {
            // No AI credits (or no valid key): answer from the offline medical library.
            streamStore.set("");
            setPending((p) => (p?.id === reqId ? { ...p, stage: "library", review: false } : p));
            reply = await answerFromLibrary({
              userMsg, hist, reason: String(draft.reason || "credits"), draftBody,
              style: prefs.style, language, instructions: instructions.trim(),
            });
          } else {
            if (!draft?.message) throw new Error("Cadus returned an empty answer. Please try again.");
            const sources = refs?.length ? safeSources(refs) : safeSources(draft.sources);
            let content = String(draft.message);
            // The finished draft (with citation markers) stays on screen while it is reviewed.
            streamStore.set(content);
            let review: ReviewMeta | undefined;
            let reviewNote: string | undefined;
            // Step 2: safety review by a second model
            if (doReview) {
              setPending((p) => (p?.id === reqId ? { ...p, stage: "review" } : p));
              try {
                const rv = await invokeCadus({
                  action: "review",
                  mode: userMsg.mode,
                  question: userMsg.content,
                  draft: content,
                  history: hist.slice(-6),
                  sources,
                  image: userMsg.image,
                  ...(files.length ? { files } : {}),
                  language,
                  ...(userMsg.voice ? { style: "voice" } : {}),
                  ...project,
                  ...styled,
                  ...tailored,
                  ...(practicePrefs ? { practice: practicePrefs } : {}),
                  ...(inst ? { institution: inst.payload } : {}),
                });
                if (rv?.message) {
                  content = String(rv.message);
                  review = rv.review ?? undefined;
                } else {
                  reviewNote = "The safety review didn't return a result for this answer. Check it carefully before relying on it.";
                }
              } catch {
                reviewNote = "The safety review couldn't run for this answer. Check it carefully before relying on it.";
              }
            }
            reply = {
              id: uid(), role: "assistant", mode: userMsg.mode, at: Date.now(), content,
              provider: draft.provider, model: draft.model,
              sources: sources.length ? sources : undefined,
              queries: Array.isArray(draft.queries) && draft.queries.length ? draft.queries : undefined,
              review, reviewNote,
              ...(inst?.titles.length ? { protocols: inst.titles } : {}),
            };
          }
        }
      } catch (e) {
        if (cancelled.current.has(reqId) || (e as { name?: string })?.name === "AbortError") {
          aborts.current.delete(reqId);
          return null;
        }
        reply = { id: uid(), role: "assistant", mode: userMsg.mode, at: Date.now(), error: true, content: friendlyError(e instanceof Error ? e.message : String(e)) };
      }
      aborts.current.delete(reqId);
      if (cancelled.current.has(reqId)) return null;
      reply.took = Date.now() - started;
      if (userMsg.mention) reply.mention = userMsg.mention;
      // Regenerating keeps the earlier answers as versions (‹ 1 / 2 ›).
      if (extra.prior && !extra.prior.error && !extra.prior.stopped) {
        const { versions: older = [], ...prev } = extra.prior;
        reply.versions = [...older, prev].slice(-5);
      }
      if (reply.provider) setLastProvider(reply.provider);
      // The answer history (not for temporary chats, which are never stored).
      // Re-read from storage so answers from other tabs are kept (the history is append-only).
      if (!extra.temp) setAudit(recordAudit(auditEntry(sid, userMsg, reply)));
      const isFirst = history.filter((m) => m.role === "user").length === 0;
      upsert(sid, (m) => [...m, reply]);
      setPending((p) => (p?.id === reqId ? null : p));
      streamStore.set("");
      notifyDone(sid, reply);
      const sess = sessionsRef.current.find((x) => x.id === sid);
      if (isFirst && !reply.error && sess?.autoTitle && !sess.temp) void autoTitle(sid, userMsg.content, reply.content);
      if (!reply.error && !reply.library && !reply.deck && !roleplay && !userMsg.voice && SMART_FOLLOW.has(userMsg.mode)) void suggestFollowups(sid, reply, userMsg, language);
      return reply;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs.style, prefs.language, prefs.safetyReview, prefs.model, prefs.notify, prefs.units, prefs.nlem, profile, personal, institution, upsert],
  );

  /** The privacy guard: hide patient identifiers before a message is stored or sent. */
  const guardText = (text: string, m: ModeId): Deidentified =>
    prefs.privacyGuard && !ROLEPLAY.has(m) ? deidentify(text) : { text, hits: {}, total: 0 };

  const setPersonal = (p: Personal) => setPersonalState(p);

  const send = (
    textOverride?: string,
    modeOverride?: ModeId,
    extra?: { lang?: string; title?: string; voice?: boolean; files?: Attachment[]; refs?: SourceRef[]; caseId?: string },
  ): Promise<Msg | null> => {
    const raw = (textOverride ?? input).trim();
    const startingNew = !(view === "chat" && activeId);
    // A chat with a Crew assistant uses its tool unless another tool was picked.
    const chatCrew = findCrew(startingNew ? crewNext : sessions.find((s) => s.id === activeId)?.crewId, crewMine);
    // An @mentioned assistant answers just this message, in its own role.
    const asked = textOverride === undefined ? mention : null;
    const crew = asked ?? chatCrew;
    const m = modeOverride ?? (!asked && crew && mode === "general" ? (crew.mode as ModeId) : mode);
    // Attachments in the composer go with what you type there, not with suggestion chips.
    const atts = extra?.files ?? (textOverride === undefined ? attachments : []);
    if ((!raw && !atts.length) || pending) return Promise.resolve(null);
    if (usage.date === today() && usage.count >= limits.questionsPerDay) {
      setUpgrade({ reason: `You've used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" });
      return Promise.resolve(null);
    }
    // Deep Dive searches live sources, which come with Core and above; only for what's typed in the box.
    const am = prefs.answerMode;
    const deep = am === "deep" && textOverride === undefined && !extra?.voice && !ROLEPLAY.has(m) && m !== "slides" && !atts.length;
    if (deep && !limits.sources) {
      setUpgrade({ reason: "Deep Dive researches PubMed and live guideline sources, part of Core and above.", feature: "sources" });
      return Promise.resolve(null);
    }
    const guard = guardText(raw, m);
    const text = guard.text;
    const isNew = startingNew;
    const sid = isNew ? uid() : activeId;
    // A chat started from a project page belongs to that project.
    const inProject = isNew && view === "project" && project ? project.id : undefined;
    const temp = isNew ? tempNext : !!sessions.find((s) => s.id === sid)?.temp;
    // "Remember that…" saves a memory, like ChatGPT (not in temporary chats or role-play).
    // In a chat with a Crew assistant, "Remember: …" goes to that assistant's memory instead.
    const crewFact = crew && !temp ? crewRememberFrom(text) : "";
    if (crewFact && crew) { const nextMem = addFact(readMemory(), crew.id, crewFact); saveMemory(nextMem); setCrewMemory(nextMem); toast(`${crew.name} will remember that`); }
    const fact = !crewFact && !temp && !ROLEPLAY.has(m) && personal.useMemory ? rememberFrom(text) : null;
    if (fact) {
      setPersonalState((p) => addMemory(p, fact));
      toast("Memory updated");
    }
    const onlyImages = atts.length > 0 && atts.every((a) => a.kind === "image");
    const userMsg: Msg = {
      id: uid(), role: "user", mode: m, at: Date.now(),
      content: text || (onlyImages ? (atts.length > 1 ? "Please analyse these images." : "Please analyse this image.") : "Please review the attached document."),
      ...(atts.length ? { files: atts } : {}),
      // An evidence summary uses only the attached PubMed records.
      search: limits.sources && !ROLEPLAY.has(m) && m !== "evidence" && (prefs.sources || m === "research" || !!crew?.sources || deep),
      ...(extra?.refs?.length ? { refs: extra.refs } : {}),
      ...(guard.total ? { privacy: { total: guard.total, hits: guard.hits } } : {}),
      ...(extra?.lang ? { lang: extra.lang } : {}),
      ...(think && textOverride === undefined ? { think: true } : {}),
      ...(deep ? { amode: "deep" as const } : !ROLEPLAY.has(m) && (am === "fast" || am === "exam" || am === "simple") ? { amode: am } : {}),
      ...(!ROLEPLAY.has(m) && prefs.tone !== "professional" ? { tone: prefs.tone } : {}),
      ...(reading && atts.length && textOverride === undefined ? { reading } : {}),
      ...(extra?.voice ? { voice: true } : {}),
      ...(asked ? { mention: { id: asked.id, name: asked.name, icon: asked.icon, tone: asked.tone } } : {}),
    };
    const history = sessions.find((s) => s.id === sid)?.messages ?? [];
    const firstFile = atts.find((a) => a.kind !== "image");
    const title = extra?.title || stripPlaceholders(text) || (firstFile ? `Document: ${firstFile.name}` : "Image analysis");
    upsert(sid, (msgs) => [...msgs, userMsg], clip(title, 64), inProject, { ...(temp ? { temp: true } : {}), ...(extra?.caseId ? { caseId: extra.caseId } : {}), ...(isNew && chatCrew ? { crewId: chatCrew.id } : {}), autoTitle: !extra?.title });
    setView("chat");
    setActiveId(sid);
    setMode(m);
    if (textOverride === undefined) {
      setInput("");
      setAttachments([]);
      setReading("");
      setMention(null);
      setAtMenu(null);
    }
    // Carrying on in an archived chat brings it back to the sidebar.
    if (!isNew && sessions.find((s) => s.id === sid)?.archived) setSessions((p) => p.map((s) => (s.id === sid ? { ...s, archived: false } : s)));
    setPop(null);
    if (!extra?.voice) focusComposer();
    return runRequest(sid, history, userMsg, instructionsFor(sid, inProject), { temp, crew });
  };

  // Links from the rest of Aethex open Cadus with a question (?q=), which is asked
  // straight away, or a case to discuss (?context=), which goes into the composer.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim() ?? "";
    let context = params.get("context")?.trim() ?? "";
    if (!q && !context) return;
    try { context = decodeURIComponent(context); } catch { /* already plain text */ }
    params.delete("q");
    params.delete("context");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    if (q) send(q.slice(0, 4000));
    else {
      setInput(context.slice(0, 12000));
      focusComposer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A shared Cadus Crew link (?crew=…) opens the assistant to preview and add.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("crew");
    if (!code) return;
    params.delete("crew");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    const c = readShareCode(code, MODES.map((x) => x.id));
    if (c) { setCrewImport(c); setView("crew"); } else toast("That Cadus Crew link is incomplete or damaged");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A shared team pack link (?crewpack=…) opens Team packs with the pack to preview and add.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("crewpack");
    if (!code) return;
    params.delete("crewpack");
    const rest = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
    const p = readPack(code, MODES.map((x) => x.id));
    if (p && (p.builtInIds.length || p.custom.length)) { setPackIncoming(p); setPacksOpen(true); setView("crew"); } else toast("That Cadus Crew pack link is incomplete or damaged");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The desktop app (tray, reminders, quick-open shortcut) and ?open= links open a part of Cadus.
  const openTargetRef = useRef<(t: OpenTarget) => void>(() => {});
  openTargetRef.current = (t: OpenTarget) => {
    if (t === "new-chat") { newChat(); focusComposer(); }
    else if (t === "ward") openWard();
    else if (t === "calculators") openCalculators();
    else if (t === "practice") openPractice();
    else openView(t);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("open");
    if (t) {
      params.delete("open");
      const rest = params.toString();
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`);
      if (isOpenTarget(t)) openTargetRef.current(t);
    }
    return installDesktopBridge((x) => openTargetRef.current(x));
  }, []);

  const stop = () => {
    if (!pending) return;
    cancelled.current.add(pending.id);
    aborts.current.get(pending.id)?.abort();
    const partial = streamStore.get().trim();
    const prior = pending.prior;
    const versions = prior && !prior.error && !prior.stopped ? [...(prior.versions ?? []), { ...prior, versions: undefined }].slice(-5) : undefined;
    const stopped: Msg = {
      id: uid(), role: "assistant", mode: pending.mode, at: Date.now(), stopped: true,
      content: partial ? closePartialMarkdown(partial) : "Response stopped.",
      took: Date.now() - pending.started,
      ...(versions ? { versions } : {}),
    };
    upsert(pending.sid, (m) => [...m, stopped]);
    const sess = sessions.find((x) => x.id === pending.sid);
    const asked = [...(sess?.messages ?? [])].reverse().find((x) => x.role === "user");
    if (asked && !sess?.temp) setAudit(recordAudit(auditEntry(pending.sid, asked, stopped)));
    streamStore.set("");
    setPending(null);
  };

  /** Edit a question and ask it again: later messages are replaced, like regenerating. */
  const resend = (msgId: string, newText: string) => {
    if (!active || pending) return;
    const idx = active.messages.findIndex((x) => x.id === msgId);
    const orig = idx >= 0 ? active.messages[idx] : undefined;
    if (!orig || orig.role !== "user") return;
    const guard = guardText(newText.trim(), orig.mode);
    if (!guard.text) return;
    const userMsg: Msg = { ...orig, id: uid(), content: guard.text, at: Date.now(), privacy: guard.total ? { total: guard.total, hits: guard.hits } : undefined };
    setEditing(null);
    if (orig.files?.some((f) => !f.data)) toast("The attached PDF isn't kept after reloading. Attach it again for a full answer.");
    upsert(active.id, (msgs) => [...msgs.slice(0, idx), userMsg]);
    void runRequest(active.id, active.messages.slice(0, idx), userMsg, instructionsFor(active.id), { temp: active.temp, crew: findCrew(userMsg.mention?.id, crewMine) ?? findCrew(active.crewId, crewMine) });
  };

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      window.setTimeout(() => setCopied(""), 1600);
      toast("Copied to clipboard");
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  const updateProfile = (p: MedicalProfile | null) => {
    const next = p ? { ...profile, ...p, completedAt: p.completedAt ?? profile?.completedAt ?? Date.now() } : null;
    setProfile(next);
    saveProfile(next);
    setProfileOpen(false);
    toast(p ? "Profile saved. Answers are now tailored to you." : "Profile cleared");
    if (next) void pushRemoteProfile(next).then((r) => { if (!r.ok && r.reason !== "not-set-up" && r.reason !== "no-credential") toast(r.message); });
  };
  /** After sign-in: the profile saved on the server for this account, so the setup is skipped on a new device. */
  const [setupState, setSetupState] = useState<"checking" | "needed" | "done">(() => (readProfile()?.completedAt ? "done" : "checking"));
  const [setupSaving, setSetupSaving] = useState(false);
  const [serverNote, setServerNote] = useState("Your profile is saved to your Aethex account.");
  useEffect(() => {
    if (!user || setupState !== "checking") return;
    let live = true;
    fetchRemoteProfile().then((r) => {
      if (!live) return;
      if (r.ok && r.profile?.completedAt) { setProfile(r.profile); saveProfile(r.profile); setSetupState("done"); return; }
      if (!r.ok && (r.reason === "not-set-up" || r.reason === "no-credential")) setServerNote("Your profile is kept on this device for now; it will be saved to your account once the profile store is switched on.");
      if (!r.ok && r.reason === "offline") setServerNote("You are offline: the profile is kept on this device and saved to your account when you are back online.");
      setSetupState("needed");
    });
    return () => { live = false; };
  }, [user, setupState]);
  const finishSetup = async (p: MedicalProfile) => {
    setSetupSaving(true);
    setProfile(p);
    saveProfile(p);
    const r = await pushRemoteProfile(p);
    setSetupSaving(false);
    setSetupState("done");
    toast(r.ok ? "Profile saved to your account" : r.reason === "not-set-up" || r.reason === "no-credential" ? "Profile saved on this device" : r.message);
  };

  const setPractice = useCallback((fn: (s: PracticeState) => PracticeState) => setPracticeState(fn), []);
  const setLearn = useCallback((fn: (s: LearnState) => LearnState) => setLearnState(fn), []);

  const openCalculators = (opts: { calc?: string; tab?: ToolsTab; drugs?: string[] } = {}) => {
    setToolsInit({ ...opts, key: Date.now() });
    setView("calculators");
    setSidebarOpen(false);
    setPop(null);
  };

  const [practiceInit, setPracticeInit] = useState<{ tab?: "today" | "mock" | "syllabus" | "subjects"; key: number }>({ key: 0 });
  const [recInit, setRecInit] = useState<RecordIncoming | undefined>(undefined);
  const [rxInit, setRxInit] = useState<{ diagnosis?: string; age?: string; sex?: string; weight?: string; key: number }>({ key: 0 });
  const openPractice = (tab?: unknown) => {
    // Also used directly as a click handler, so only a tab name counts.
    if (tab === "today" || tab === "mock" || tab === "syllabus" || tab === "subjects") setPracticeInit({ tab, key: Date.now() });
    setView("practice");
    setSidebarOpen(false);
    setPop(null);
  };

  /** Research: PubMed search, the reading list and the thesis kit. A query runs straight away. */
  const openResearch = (opts: { tab?: ResearchTab; query?: string } = {}) => {
    setResearchInit({ ...opts, key: Date.now() });
    setView("research");
    setSidebarOpen(false);
    setPop(null);
  };

  const openWard = () => {
    setView("ward");
    setSidebarOpen(false);
    setPop(null);
  };
  const openView = (v: View) => { setView(v); setSidebarOpen(false); setPop(null); };
  const openDrugs = (opts: { tab?: "reference" | "prescriber"; query?: string } = {}) => {
    setDrugsInit({ ...opts, key: Date.now() });
    setView("drugs");
    setSidebarOpen(false);
    setPop(null);
  };
  const openCases = (id = "") => {
    setCaseOpen(id);
    setView("cases");
    setSidebarOpen(false);
    setPop(null);
  };
  const activeCases = cases.filter((c) => c.status === "active").length;
  /** Ask Cadus about a case: the whole (de-identified) sheet goes with the question, in a chat linked to the case. */
  const askAboutCase = (c: PatientCase, m: string, question: string, title: string): boolean => {
    if (pending) { toast("Wait for the current answer to finish"); return false; }
    void send(`${question}\n\nCASE (de-identified):\n${caseSummary(c)}`, (MODE[m as ModeId] ? m : "general") as ModeId, { title: clip(title, 64), caseId: c.id });
    return true;
  };
  /** Puts a case on today's ward round (or says it is already there). */
  const addCaseToWard = (c: PatientCase) => {
    const w = readWard();
    const label = `${c.age}${c.sex && c.sex !== "O" ? c.sex : ""}`.trim();
    if (w.patients.some((p) => (c.bed && p.bed === c.bed) && p.label === label)) { toast("This patient is already on the ward round"); return; }
    if (w.patients.length >= WARD_MAX) { toast("The ward list is full"); return; }
    const next = { ...w, patients: [...w.patients, newPatient({ bed: c.bed, label, diagnosis: c.complaint || c.problems[0] || "", problems: c.problems.join("; "), meds: c.meds, plan: c.plan })] };
    saveWard(next);
    setWardInfo(next);
    toast("Added to the ward round");
  };
  /** An answer's gist, added to its case's timeline. */
  const addAnswerToCase = (caseId: string, m: Msg) => {
    const plain = referenceToPlain(m.content).replace(/^\*\*Bottom line:?\*\*:?\s*/i, "");
    const first = plain.split(/\n\s*\n/)[0].replace(/[*_#`]/g, "").trim();
    const text = clip(`${MODE[m.mode]?.label ?? "Cadus"}: ${first}`, 600);
    setCases((list) => list.map((c) => (c.id === caseId ? { ...c, timeline: [newEntry("cadus", text), ...c.timeline], updatedAt: Date.now() } : c)));
    toast("Added to the case timeline");
  };

  /** Everything Cadus keeps in this browser, as one JSON file. */
  const exportAll = () => downloadJSON(`cadus-export-${today()}.json`, {
    exportedAt: new Date().toISOString(),
    sessions: sessions.filter((x) => !x.temp),
    projects,
    library,
    documents: docs,
    personalisation: personal,
    profile,
    readingList: readReading(),
    wardList: readWard(),
    answerHistory: audit,
    letterhead: { ...letterhead, logo: undefined },
    institution,
    patientCases: cases,
    prescriptions: readJSON(RX_KEY_EXPORT, []),
    notes: readJSON(NOTES_KEY_EXPORT, []),
    leaflets: readJSON(LEAFLETS_KEY_EXPORT, []),
    learning: readJSON(LEARN_KEY_EXPORT, null),
    caseSimulator: readJSON(SIMS_KEY, []),
    prescriptionChecks: readJSON(RXCHECKS_KEY, []),
    guidelineWatch: readJSON(WATCH_KEY, null),
    reportExplanations: readJSON(EXPLAINS_KEY, []),
    translatorSessions: readJSON(TRANSLATOR_KEY, []),
    clinicalPathways: readJSON(PATHWAYS_KEY, []),
    flashcards: readJSON(DECKS_KEY, []),
    comparisons: readJSON(COMPARES_KEY, []),
    medicineReconciliations: readJSON(MEDREC_KEY, []),
    presentations: readJSON(PRESENT_KEY, []),
    dischargeSummaries: readJSON(DISCHARGE_KEY, []),
    handovers: readJSON(HANDOVER_KEY, []),
    differentials: readJSON(DDX_KEY, []),
    studyPlan: readJSON(STUDYPLAN_KEY, null),
    ecgReads: readJSON(ECG_KEY, []),
    antibioticPlans: readJSON(ABX_KEY, []),
    procedureGuides: readJSON(PROC_KEY, []),
    poisoningPlans: readJSON(POISON_KEY, []),
    logbook: readJSON(LOG_KEY, []),
    followUps: readJSON(FOLLOWUP_KEY, []),
  });
  /** Removes everything Cadus keeps in this browser (Quick Consult too) and starts afresh. */
  const deleteEverything = () => {
    try {
      Object.keys(localStorage).filter((k) => /^cadus(?:3\.|[._-])/.test(k)).forEach((k) => localStorage.removeItem(k));
    } catch { /* blocked */ }
    window.location.reload();
  };

  /** First-run setup is done: save the profile and preferences, then the tour if they want it. */
  const finishOnboarding = (r: OnboardingResult) => {
    setFlag(ONBOARD_KEY);
    setOnboardOpen(false);
    if (r.profile) {
      const merged = { ...profile, ...r.profile, completedAt: profile?.completedAt ?? Date.now() };
      setProfile(merged);
      saveProfile(merged);
      void pushRemoteProfile(merged);
    }
    setPrefs((p) => ({ ...p, units: r.units, nlem: r.nlem, language: r.language }));
    if (r.tour) { setMoreOpen(true); setOpenGroups(["ward", "diagnosis"]); window.setTimeout(() => setTourOpen(true), 300); }
    else focusComposer();
  };
  const startTour = () => {
    // The tour points at the question box, so it runs over the chat on screen (or the home page).
    if (view !== "chat") setView("chat");
    setSettingsOpen(false);
    setPaletteOpen(false);
    setPop(null);
    setSidebarOpen(false);
    setMoreOpen(true); // the ward, research and calculator steps point into the More drawer
    setOpenGroups(["ward", "diagnosis"]); // and into these two groups
    window.setTimeout(() => setTourOpen(true), 250);
  };
  const endTour = () => {
    setTourOpen(false);
    setFlag(TOUR_KEY);
    focusComposer();
  };
  const TOUR_STEPS: TourStep[] = [
    { selector: ".cx-composer", title: "Ask anything clinical", text: "Describe a case or ask a question. Cadus drafts the answer, a second model checks it, and you see its confidence, corrections and sources." },
    { selector: ".cx-tools-btn", title: "Pick a tool", text: "Differentials, dose calculations, notes, letters, certificates and prescriptions each give a structured answer you can use straight away." },
    { selector: ".cx-src", title: "Cite sources", text: "Turn on Sources and Cadus searches WHO, ICMR, NICE and PubMed, and cites what it finds. Hover a numbered badge to preview the source." },
    { selector: '[data-tour="cases"]', title: "Cases", text: "A workspace per patient: problems, timeline, tasks and a handover summary, kept de-identified on this device." },
    { selector: '[data-tour="practice"]', title: "Learn", text: "A daily question set, spaced-repetition review, timed mocks with analysis, and a syllabus tracker for NEET-PG, INI-CET and university exams." },
    { selector: '[data-tour="tools"]', title: "Tools", text: `Ward round, research, the drug database and prescriber, ${CALCULATORS.length} calculators, projects and decks, plus every specialised answer mode.` },
    { selector: '[data-tour="ward"]', title: "Ward round", text: "Today's patients by bed number, with jobs, a round checklist and a one-click handover. It stays on this device." },
    { selector: '[data-tour="research"]', title: "Research", text: "Search PubMed, keep a reading list, export citations and get evidence summaries, plus sample sizes for your thesis." },
    { selector: '[data-tour="calculators"]', title: "Calculators and lab trends", text: `${CALCULATORS.length} bedside calculators, lab trend charts and the interaction checker, computed in your browser without AI.` },
    { selector: ".cx-acct", title: "Settings and safety", text: "Your letterhead, units, language and privacy live here, with how Cadus keeps answers safe." },
  ];

  /** An evidence summary: the selected PubMed records go with the question, and become its sources. */
  const summariseEvidence = (query: string, papers: Paper[], ask?: string) => {
    if (!papers.length) return;
    if (pending) { toast("Wait for the current answer to finish"); return; }
    const records = evidenceRecords(query, papers);
    const file: Attachment = {
      id: uid(),
      kind: "text",
      name: papers.length === 1 ? "PubMed record.txt" : `PubMed records (${papers.length}).txt`,
      size: new Blob([records]).size,
      data: records,
    };
    const text = ask ?? (papers.length === 1 ? "Summarise this study and what it shows." : `Summarise what these ${papers.length} studies show about ${query}.`);
    void send(text, "evidence", { files: [file], refs: evidenceSources(papers), title: clip(papers.length === 1 ? papers[0].title : `Evidence: ${query}`, 64) });
  };

  /** Ask again for a new answer. The old one is kept as a version; feedback (if any) asks for a better one. */
  const regenerate = (assistantId: string, improve?: { reasons: string[]; comment: string }) => {
    if (!active || pending) return;
    const idx = active.messages.findIndex((m) => m.id === assistantId);
    let userIdx = -1;
    for (let i = idx - 1; i >= 0; i--) if (active.messages[i].role === "user") { userIdx = i; break; }
    if (userIdx < 0) return;
    const userMsg = active.messages[userIdx];
    const prior = active.messages[idx];
    if (userMsg.files?.some((f) => !f.data)) toast("The attached PDF isn't kept after reloading. Attach it again for a full answer.");
    upsert(active.id, (msgs) => msgs.slice(0, userIdx + 1));
    void runRequest(active.id, active.messages.slice(0, userIdx), userMsg, instructionsFor(active.id), {
      prior,
      temp: active.temp,
      crew: findCrew(userMsg.mention?.id, crewMine) ?? findCrew(active.crewId, crewMine),
      ...(improve ? { improve: { ...improve, previous: prior?.content ?? "" } } : {}),
    });
  };

  /* --------------------------------------------------------- actions */

  const questionFor = (m: Msg): string => {
    const idx = messages.findIndex((x) => x.id === m.id);
    return [...messages.slice(0, Math.max(idx, 0))].reverse().find((x) => x.role === "user")?.content || active?.title || "Cadus answer";
  };

  const copy = async (m: Msg) => {
    try {
      // Dose cards and evidence labels become plain text; a flowchart's source is left out (the text says the same).
      await navigator.clipboard.writeText(withSources(referenceToPlain(m.content), m.sources));
      setCopied(m.id);
      window.setTimeout(() => setCopied(""), 1600);
      toast("Copied to clipboard");
    } catch {
      toast("Couldn't copy to the clipboard");
    }
  };

  const savedIds = useMemo(() => new Set(library.map((x) => x.messageId)), [library]);
  const toggleSave = (m: Msg) => {
    if (savedIds.has(m.id)) {
      setLibrary((l) => l.filter((x) => x.messageId !== m.id));
      toast("Removed from Library");
      return;
    }
    setLibrary((l) => [{ id: uid(), sessionId: activeId, messageId: m.id, question: questionFor(m), answer: m.content, mode: m.mode, at: Date.now(), sources: safeSources(m.sources) }, ...l]);
    toast("Saved to Library");
  };

  const speak = (m: Msg) => {
    if (speakingId === m.id) { stopSpeaking(); setSpeakingId(""); return; }
    const done = () => setSpeakingId((id) => (id === m.id ? "" : id));
    setSpeakingId(m.id);
    speakAloud(markdownToText(m.content).slice(0, 12000), { lang: prefs.language === "Hindi" ? "hi" : "en", quality: "fast", onEnd: done });
  };

  /** A title for an answer as a document: its heading or the tool's name for letters and notes, otherwise the question. */
  const answerTitle = (m: Msg, content = m.content) => {
    const heading = /^#{1,2}\s+(.+)$/m.exec(content)?.[1]?.replace(/[*_`]/g, "").trim();
    if (DOC_MODES.has(m.mode) && m.mode !== "evidence" && m.mode !== "patient") return clip(heading || MODE[m.mode].label, 80);
    if (m.mode === "patient" && heading) return clip(heading, 80);
    return clip(stripPlaceholders(questionFor(m)) || active?.title || "Cadus answer", 80);
  };
  const exportAnswer = (m: Msg) => {
    // Letters, notes and certificates are exported as the document alone; other answers with the question.
    const isDoc = DOC_MODES.has(m.mode) && m.mode !== "evidence";
    void exportPdf(
      isDoc ? answerTitle(m) : active?.title || "Cadus answer",
      isDoc
        ? [{ who: "", text: withSources(m.content, m.sources) }]
        : [{ who: "Question", text: questionFor(m) }, { who: m.review ? "Cadus (safety-reviewed)" : "Cadus", text: withSources(m.content, m.sources) }],
      { letterhead: lh, signature: SIGNED_MODES.has(m.mode) },
    );
  };

  const exportSession = (s?: Session) => {
    const target = s ?? active;
    if (!target) return;
    setPop(null);
    setDlFor("");
    void exportPdf(target.title, target.messages.filter((m) => !m.stopped).map((m) => ({ who: m.role === "user" ? "You" : m.review ? "Cadus (safety-reviewed)" : "Cadus", text: withSources(m.content, m.sources) })));
  };

  /** Attach files from the picker, a paste, a drop or the camera: images, PDFs and text files. */
  const onFiles = async (list?: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setPop(null);
    let next = attachments;
    let added = 0;
    for (const f of files) {
      try {
        const a = await readAttachment(f, (img) => fileToDataUrl(img));
        const problem = attachProblem(next, a);
        if (problem) { toast(problem); continue; }
        next = [...next, a];
        added += 1;
      } catch (e) {
        toast(e instanceof Error ? e.message : `Couldn't read ${f.name}`);
      }
    }
    if (!added) return;
    setAttachments(next);
    // A first image switches to the systematic image read, as before.
    if (mode === "general" && next.length === added && next.every((a) => a.kind === "image")) setMode("image");
    taRef.current?.focus();
  };
  const onFile = (f?: File | null) => onFiles(f ? [f] : []);

  /** Word and Markdown downloads of an answer or a whole chat. */
  const downloadWord = (title: string, md: string, mode?: string) => {
    downloadBlob(`${fileSlug(title, "cadus-answer")}.docx`, markdownToDocx(title, md, { letterhead: lh, signature: !!mode && SIGNED_MODES.has(mode) }));
    toast(lh ? "Word document downloaded with your letterhead" : "Word document downloaded");
  };
  /** Print an answer or document with the letterhead (patient handouts in large type). */
  const printDoc = (title: string, md: string, opts: { mode?: string; sources?: SourceRef[]; large?: boolean } = {}) => {
    // A first heading that repeats the title isn't printed twice.
    const body = md.replace(/^#{1,2}\s+(.+)\n+/, (line, h: string) => (h.replace(/[*_`]/g, "").trim().toLowerCase() === title.trim().toLowerCase() ? "" : line));
    void printMarkdown({ title, md: body, sources: opts.sources, letterhead: lh, signature: !!opts.mode && SIGNED_MODES.has(opts.mode), large: opts.large });
  };
  const chatMarkdown = (t: Session) =>
    `# ${t.title}\n\n${t.messages.filter((m) => !(m.stopped && m.content === "Response stopped.")).map((m) => (m.role === "user" ? `**You:** ${m.content}` : withSources(referenceForDocument(m.content), m.sources))).join("\n\n---\n\n")}\n`;
  const exportSessionAs = (kind: "word" | "md", s?: Session) => {
    const target = s ?? active;
    if (!target) return;
    setPop(null);
    setDlFor("");
    if (kind === "word") downloadWord(target.title, chatMarkdown(target).replace(/^# .*\n\n/, ""));
    else downloadBlob(`${fileSlug(target.title, "cadus-chat")}.md`, new Blob([chatMarkdown(target)], { type: "text/markdown" }));
  };
  const shareAnswer = async (m: Msg) => {
    const text = withSources(markdownToText(m.content), m.sources);
    try {
      if (navigator.share) await navigator.share({ title: active?.title || "Cadus answer", text });
      else { await navigator.clipboard.writeText(text); toast("Copied to share"); }
    } catch { /* share cancelled */ }
  };

  /** The version of an answer being shown (regenerated answers keep earlier versions). */
  const allVersions = (m: Msg): Msg[] => [...(m.versions ?? []), m];
  const shownVersion = (m: Msg): Msg => {
    const all = allVersions(m);
    const i = versionView[m.id];
    return i === undefined || i < 0 || i >= all.length ? m : all[i];
  };

  /** Thumbs up or down; thumbs down can ask for a better answer straight away. */
  const setFeedback = (m: Msg, value: "up" | "down" | undefined, note?: Msg["feedbackNote"]) => {
    if (!active) return;
    const sid = active.id;
    // Feedback doesn't move the chat to the top of the list.
    setSessions((p) => p.map((s) => (s.id !== sid ? s : {
      ...s,
      messages: s.messages.map((x) => (x.id === m.id ? { ...x, feedback: value, feedbackNote: value === "down" ? note ?? x.feedbackNote : undefined } : x)),
    })));
    // Answers from a Crew assistant also count towards its Rate & improve.
    const crewId = m.mention?.id ?? active.crewId;
    if (crewId) {
      if (!value) setCrewRatings((r) => unrateCrew(r, crewId, m.id));
      else {
        const i = active.messages.findIndex((x) => x.id === m.id);
        const q = [...active.messages.slice(0, Math.max(0, i))].reverse().find((x) => x.role === "user")?.content ?? "";
        const why = note ? [...note.reasons, note.comment].filter(Boolean).join("; ") : undefined;
        setCrewRatings((r) => rateCrew(r, crewId, { msgId: m.id, vote: value, q, a: m.content, ...(why ? { why } : {}) }));
      }
    }
  };
  const thumb = (m: Msg, value: "up" | "down") => {
    if (m.feedback === value) {
      setFeedback(m, undefined);
      if (fb?.id === m.id) setFb(null);
      return;
    }
    setFeedback(m, value);
    if (value === "down") setFb({ id: m.id, reasons: [], comment: "" });
    else {
      if (fb?.id === m.id) setFb(null);
      toast("Thanks for the feedback");
    }
  };
  const submitFeedback = (improve: boolean) => {
    if (!fb || !active) return;
    const target = active.messages.find((x) => x.id === fb.id);
    if (!target) { setFb(null); return; }
    const note = { reasons: fb.reasons, comment: fb.comment.trim().slice(0, 600) };
    setFeedback(target, "down", note);
    setFb(null);
    if (improve) regenerate(target.id, note);
    else toast("Thanks. Your feedback is saved with this answer on this device.");
  };

  /** Canvas: open an answer as an editable document beside the chat. */
  const openCanvas = (m: Msg) => {
    const existing = docs.find((d) => d.msgId === m.id);
    if (existing) { setCanvasId(existing.id); return; }
    const q = questionFor(m);
    const heading = /^#\s+(.+)$/m.exec(m.content)?.[1];
    const title = clip(heading || (MODE[m.mode] && m.mode !== "general" ? `${MODE[m.mode].label}: ${stripPlaceholders(q) || q}` : stripPlaceholders(q) || q || "Cadus document"), 80).replace(/\?+$/, "");
    // `m` is the version on screen (regenerated answers keep earlier versions).
    const doc: CanvasDoc = { id: uid(), title, text: m.content, sessionId: active?.id, msgId: m.id, mode: m.mode, createdAt: Date.now(), updatedAt: Date.now(), history: [] };
    setDocs((d) => [doc, ...d]);
    setCanvasId(doc.id);
    setPop(null);
  };
  /** A blank document: type it yourself or ask Cadus to write it. */
  const newDocument = () => {
    const doc: CanvasDoc = { id: uid(), title: "Untitled document", text: "", createdAt: Date.now(), updatedAt: Date.now(), history: [] };
    setDocs((d) => [doc, ...d]);
    setCanvasId(doc.id);
    setPop(null);
    setSidebarOpen(false);
  };
  const closeCanvas = () => {
    // A blank document that was never written in isn't kept.
    if (canvasDoc && !canvasDoc.text.trim()) {
      const id = canvasDoc.id;
      setDocs((d) => d.filter((x) => x.id !== id));
    }
    setCanvasId("");
  };
  const deleteDoc = (id: string) => {
    setDocs((d) => d.filter((x) => x.id !== id));
    if (canvasId === id) setCanvasId("");
    toast("Document deleted");
  };
  const updateDoc = (doc: CanvasDoc) => setDocs((d) => d.map((x) => (x.id === doc.id ? doc : x)));
  const canvasEdit = async (text: string, instruction: string): Promise<string> => {
    // The privacy guard covers Canvas edits too.
    const guard = (t: string) => (prefs.privacyGuard ? deidentify(t) : { text: t, total: 0 });
    const doc = guard(text);
    const ask = guard(instruction);
    const hidden = doc.total + ask.total;
    const canvasInst = institutionPayload(institution, `${canvasDoc?.title ?? ""}\n${ask.text}\n${doc.text.slice(0, 1500)}`);
    if (hidden) toast(`Privacy guard hid ${hidden === 1 ? "1 identifier" : `${hidden} identifiers`} before sending`);
    const r = await invokeCadus({ action: "canvas-edit", document: doc.text, instruction: ask.text, mode: canvasDoc?.mode, language: prefs.language, model: prefs.model, ...(practicePrefs ? { practice: practicePrefs } : {}), ...(canvasInst ? { institution: canvasInst.payload } : {}) });
    if (typeof r?.document !== "string" || !r.document.trim()) throw new Error("The edit came back empty. Please try again.");
    return r.document as string;
  };

  /** Archive keeps a chat out of the sidebar without deleting it. */
  const setArchived = (id: string, archived: boolean) => {
    setSessions((p) => p.map((x) => (x.id === id ? { ...x, archived, pinned: archived ? false : x.pinned } : x)));
    setPop(null);
    if (archived && id === activeId) setActiveId("");
    toast(archived ? "Chat archived. Find it in Settings, Data and privacy." : "Chat restored");
  };

  /** Voice mode: ask in the current chat and resolve with the spoken answer. */
  const sendRef = useRef(send);
  sendRef.current = send;
  const voiceAsk = useCallback(async (text: string) => {
    const reply = await sendRef.current(text, undefined, { voice: true });
    return reply && !reply.error ? reply.content : "";
  }, []);
  const canVoice = voiceSupported();
  /** Spoken role-play: the viva examiner, or the OSCE patient in a voice that fits their age and sex. */
  const rolePersona = (m: ModeId, fresh: boolean): VoicePersona | undefined => {
    const isFinal = (r: string) => /##\s*(Scorecard|Examiner feedback)/i.test(r);
    if (m === "viva") return {
      name: "Viva examiner",
      voice: pickVoice(cachedVoices(), "M", 60) || undefined,
      intro: fresh ? "Hello, I'm your examiner today. Which topic would you like your viva on?" : undefined,
      finishText: "Finish and score",
      isFinal,
      listenHint: "Answer the examiner",
      note: "Eight questions, then a scorecard. Everything is written in the chat too.",
    };
    if (m === "osce") return {
      name: "OSCE patient",
      voice: (r) => { const c = characterFromText(r); return c ? pickVoice(cachedVoices(), c.sex, c.age) || undefined : undefined; },
      intro: fresh ? "Welcome to the station. Which history would you like to take? For example chest pain or fever. Or say: any station." : undefined,
      finishText: "Finish and score",
      isFinal,
      spoken: (r) => speakable(withoutStageLine(r)),
      listenHint: "Take the history. Introduce yourself to the patient",
      note: "Say \"Finish and score\" or tap the button when you're done. Everything is written in the chat too.",
    };
    return undefined;
  };
  const startVoice = async (asMode?: ModeId) => {
    if (!voiceSupported()) { toast(IN_DESKTOP_APP ? NO_DICTATION : "Voice mode needs a browser with speech recognition, such as Chrome, Edge or Safari"); return; }
    if (pending) { toast("Wait for the current answer to finish"); return; }
    const m = asMode ?? mode;
    if (asMode) newChat(asMode);
    else if (view !== "chat") setView("chat");
    if (m === "slides" || m === "image") setMode("general");
    setPop(null);
    setSidebarOpen(false);
    if (ROLEPLAY.has(m)) {
      await preloadVoices();
      setVoicePersona(rolePersona(m, !!asMode || !sim));
    } else setVoicePersona(undefined);
    setVoiceOpen(true);
  };

  /** Desktop notifications when an answer is ready in a background tab. */
  const toggleNotify = async () => {
    if (prefs.notify) { setPrefs((p) => ({ ...p, notify: false })); return; }
    if (typeof Notification === "undefined") { toast("This browser doesn't support notifications"); return; }
    let perm = Notification.permission;
    if (perm === "default") {
      try { perm = await Notification.requestPermission(); } catch { /* treated as blocked */ }
    }
    if (perm === "granted") {
      setPrefs((p) => ({ ...p, notify: true }));
      toast("Cadus will notify you when an answer is ready");
    } else toast("Notifications are blocked for this site. Allow them in your browser settings.");
  };

  /** Drag files anywhere onto the chat to attach them. */
  const hasFiles = (e: ReactDragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const dropHandlers = {
    onDragEnter: (e: ReactDragEvent) => { if (hasFiles(e)) { e.preventDefault(); setDragDepth((d) => d + 1); } },
    onDragOver: (e: ReactDragEvent) => { if (hasFiles(e)) e.preventDefault(); },
    onDragLeave: (e: ReactDragEvent) => { if (hasFiles(e)) setDragDepth((d) => Math.max(0, d - 1)); },
    onDrop: (e: ReactDragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragDepth(0);
      if (view !== "chat" && view !== "project") setView("chat");
      void onFiles(e.dataTransfer.files);
    },
  };

  /** Sources beside the chat (Canvas closes: they share the space). */
  const openSources = (mid: string, n?: number) => {
    setCanvasId("");
    setCitePrev(null);
    setSourcesFor({ mid, n });
  };
  /** A citation badge: its answer and number. */
  const citeAt = (el: EventTarget | null): { mid: string; n: number; el: HTMLElement } | null => {
    const sup = (el as HTMLElement | null)?.closest?.(".md-cite") as HTMLElement | null;
    const mid = (sup?.closest(".cx-a") as HTMLElement | null)?.dataset.mid;
    const n = Number(sup?.dataset.n);
    return sup && mid && n ? { mid, n, el: sup } : null;
  };
  const showCite = (t: EventTarget | null) => {
    const c = citeAt(t);
    if (!c) return;
    window.clearTimeout(citeTimer.current);
    const r = c.el.getBoundingClientRect();
    const above = r.bottom + 150 > window.innerHeight;
    setCitePrev({ mid: c.mid, n: c.n, x: Math.max(12, Math.min(window.innerWidth - 332, r.left - 20)), y: above ? r.top - 8 : r.bottom + 8, above });
  };
  const hideCite = () => {
    window.clearTimeout(citeTimer.current);
    citeTimer.current = window.setTimeout(() => setCitePrev(null), 180);
  };
  const citeHandlers = {
    onMouseOver: (e: ReactMouseEvent<HTMLDivElement>) => showCite(e.target),
    onMouseOut: (e: ReactMouseEvent<HTMLDivElement>) => { if (citeAt(e.target)) hideCite(); },
    onFocus: (e: ReactFocusEvent<HTMLDivElement>) => showCite(e.target),
    onBlur: (e: ReactFocusEvent<HTMLDivElement>) => { if (citeAt(e.target)) hideCite(); },
    onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const c = (e.key === "Enter" || e.key === " ") && citeAt(e.target);
      if (c) { e.preventDefault(); openSources(c.mid, c.n); }
    },
  };

  /** Copy buttons on tables and code blocks in answers; citation badges open the sources. */
  const onThreadClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const cite = citeAt(e.target);
    if (cite) { openSources(cite.mid, cite.n); return; }
    const btn = (e.target as HTMLElement).closest?.(".md-copy") as HTMLElement | null;
    if (!btn) return;
    const box = btn.parentElement;
    const table = box?.querySelector("table");
    const text = table
      ? Array.from(table.querySelectorAll("tr")).map((tr) => Array.from(tr.querySelectorAll("th,td")).map((c) => (c.textContent || "").trim()).join("\t")).join("\n")
      : box?.querySelector("pre")?.textContent || "";
    if (!text) return;
    void navigator.clipboard?.writeText(text).then(
      () => { btn.textContent = "Copied"; toast(table ? "Table copied (paste into Excel or Word)" : "Code copied"); window.setTimeout(() => { btn.textContent = "Copy"; }, 1500); },
      () => toast("Couldn't copy to the clipboard"),
    );
  };

  const toggleVoice = () => {
    const SR = speechRecognition();
    if (!SR) { toast(NO_DICTATION); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = prefs.language === "Hindi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput((base ? `${base} ` : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => { setListening(false); const m = dictationError(e?.error); if (m) toast(m); };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const pickMode = (id: ModeId) => {
    setMode(id);
    setPop(null);
    if (id === "image" && !attachments.some((a) => a.kind === "image")) fileRef.current?.click();
    focusComposer();
  };

  const startTool = (id: ModeId) => {
    newChat(id);
    if (id === "image") window.setTimeout(() => fileRef.current?.click(), 80);
  };

  const openSettings = (tab: SettingsTab = "general") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
    setPop(null);
    setSidebarOpen(false);
  };

  const togglePop = (key: string) => setPop((p) => (p === key ? null : key));

  /** Open a composer menu sized to the space available above or below the composer. */
  const toggleComposerMenu = (key: "add" | "tools" | "amode", placement: "hero" | "dock") => {
    const r = composerRef.current?.getBoundingClientRect();
    if (r) setMenuMax(Math.max(220, Math.floor(placement === "hero" ? window.innerHeight - r.bottom - 20 : r.top - 20)));
    togglePop(key);
  };

  /* --------------------------------------------------------- palette */

  const paletteSections = (() => {
    const q = palQuery.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);
    const actions: PaletteItem[] = [
      { key: "a:new", label: "New chat", hint: `${MOD} ⇧ O`, icon: SquarePen, run: () => newChat() },
      { key: "a:crew", label: "Cadus Crew: assistants", hint: "Ready-made and your own", icon: Bot, run: () => openCrew() },
      { key: "a:huddle", label: "Crew Huddle: ask several assistants at once", hint: "Side-by-side answers and a checked combined answer", icon: Users2, run: () => openHuddle() },
      { key: "a:debate", label: "Crew Debate: two assistants argue, a judge decides", hint: "Thrombolyse or not, rate or rhythm, operate or wait", icon: Swords, run: () => openView("debate") },
      { key: "a:playbooks", label: "Crew Playbooks: chain assistants into a workflow", hint: "Notes to presentation to discharge summary", icon: Workflow, run: () => openView("playbooks") },
      { key: "a:quizbattle", label: "Crew Quiz Battle: MCQs against the clock or a friend", hint: "Any topic, NEET-PG level, streaks and leaderboard", icon: Trophy, run: () => openView("quizbattle") },
      { key: "a:caseround", label: "Crew Case Round: a case through several specialists", hint: "Medical round, surgical MDT, tumour board, consensus plan", icon: Users2, run: () => openView("caseround") },
      { key: "a:rooms", label: "Crew Chat Rooms: group chat with several assistants", hint: "@-mention one, @all, or let the best one answer", icon: MessagesSquare, run: () => openView("rooms") },
      { key: "a:drill", label: "Crew Daily Drill: 5 questions a day with streaks", hint: "Weakest topic first, calendar and weak spots", icon: Flame, run: () => openView("drill") },
      { key: "a:crewnotes", label: "Crew Notes & Flashcards", hint: "Saved assistant answers, flashcards, spaced repetition", icon: StickyNote, run: () => openView("crewnotes") },
      { key: "a:checkins", label: "Crew Check-ins: daily tip, weekly plan", hint: "An assistant sends a tip or a study plan", icon: BellRing, run: () => openView("checkins") },
      { key: "a:crewstats", label: "Crew Stats & Badges", hint: "Level, badges, quiz leaderboard", icon: Award, run: () => openView("crewstats") },
      { key: "a:crewcompare", label: "Crew Compare: same question to 2–3 assistants", hint: "Side by side, differences and doses highlighted", icon: Columns3, run: () => openView("crewcompare") },
      { key: "a:crewvoice", label: "Crew Voice Chat", hint: "Speak to an assistant and hear the reply", icon: Mic, run: () => openView("crewvoice") },
      { key: "a:crewtemplates", label: "Crew Prompt Templates", hint: "Reusable prompts with blanks", icon: LibraryBig, run: () => openView("crewtemplates") },
      { key: "a:crewtimeline", label: "Crew Timeline & Export", hint: "Everything you did with Crew, as Markdown or PDF", icon: ScrollText, run: () => openView("crewtimeline") },
      { key: "a:crewworkspaces", label: "Crew Workspaces: assistants per rotation", hint: "Surgery posting, NEET-PG prep, thesis year", icon: Briefcase, run: () => openView("crewworkspaces") },
      { key: "a:crewdigest", label: "Crew Digest: your week in Crew", hint: "Top assistants, questions, accuracy, topics to revise", icon: CalendarRange, run: () => openView("crewdigest") },
      { key: "a:crewschedules", label: "Assistant Schedules: a daily viva or MCQs", hint: "Pick an assistant, days and a time; Cadus reminds you", icon: AlarmClock, run: () => openView("crewschedules") },
      { key: "a:deep", label: prefs.answerMode === "deep" ? "Turn off Deep Dive" : "Deep Dive: a cited research report", hint: "PubMed and guidelines, step by step", icon: Telescope, run: () => { setPrefs((p) => ({ ...p, answerMode: p.answerMode === "deep" ? "auto" : "deep" })); focusComposer(); } },
      ...ANSWER_MODES.filter((am) => am.id !== "deep" && am.id !== prefs.answerMode).map((am) => ({ key: `a:mode:${am.id}`, label: `Mode: ${am.label}`, hint: am.desc, icon: am.icon, run: () => { setPrefs((p) => ({ ...p, answerMode: am.id })); focusComposer(); } })),
      { key: "a:newproj", label: "New project", icon: FolderPlus, run: () => newProject() },
      { key: "a:projects", label: "Open projects", icon: Folder, run: () => openProjects() },
      { key: "a:lib", label: "Open Library", icon: Library, run: () => setView("library") },
      { key: "a:decks", label: "Open decks", icon: Presentation, run: () => setView("decks") },
      { key: "a:tools", label: "Browse clinical tools", icon: LayoutGrid, run: () => setView("tools") },
      { key: "a:ward", label: "Open ward round", hint: "Your patient list", icon: BedDouble, run: () => openWard() },
      { key: "a:cases", label: "Patient cases", hint: "Case sheets with a timeline", icon: ClipboardList, run: () => openCases() },
      { key: "a:drugs", label: "Drug reference", hint: "Doses, NLEM, kidney and liver notes", icon: Pill, run: () => openDrugs() },
      { key: "a:rx", label: "New prescription", hint: "Build, check and print on your letterhead", icon: Pill, run: () => openDrugs({ tab: "prescriber" }) },
      { key: "a:scribe", label: "Scribe: dictate a note", hint: "SOAP, admission, follow-up, procedure, discharge, with ICD-10", icon: Mic, run: () => openView("scribe") },
      { key: "a:emergency", label: "Emergency protocols", hint: "Sepsis, STEMI, DKA, anaphylaxis, arrest, with a clock; crash-cart doses", icon: Siren, run: () => openView("emergency") },
      { key: "a:paeds", label: "Paediatrics and obstetrics", hint: "Doses by weight, growth, immunisation, EDD", icon: Baby, run: () => openView("paeds") },
      { key: "a:leaflets", label: "Patient leaflet or consent form", hint: "In the patient's language, on your letterhead", icon: FileText, run: () => openView("leaflets") },
      { key: "a:simulator", label: "Case Simulator: practise on a live patient", hint: "History, examination, tests and treatment, then a scored debrief", icon: HeartPulse, run: () => openView("simulator") },
      { key: "a:rxcheck", label: "Rx Safety Check: check a prescription", hint: "Doses, interactions, allergy, pregnancy, kidney; generics and Jan Aushadhi", icon: ShieldPlus, run: () => openView("rxcheck") },
      { key: "a:watch", label: "Guideline Watch: what's new in my specialty", hint: "New guidelines, meta-analyses and trials from PubMed", icon: BellRing, run: () => openView("watch") },
      { key: "a:explain", label: "Report Explainer: explain a report to a patient", hint: "A summary for you and an explanation in the patient's language", icon: FileScan, run: () => openView("explain") },
      { key: "a:translate", label: "Consult Translator: talk with a patient in their language", hint: "Two-way, by voice or typing, in 13 Indian languages", icon: Languages, run: () => openView("translate") },
      { key: "a:pathways", label: "Clinical Pathways: step-by-step decisions", hint: "Chest pain, sepsis, fever, DKA, stroke and more", icon: GitFork, run: () => openView("pathways") },
      { key: "a:flashcards", label: "Flashcards: review and make decks", hint: "Spaced repetition and Anki export", icon: Layers, run: () => openView("flashcards") },
      { key: "a:today", label: "Today: my day at a glance", hint: "Ward jobs, revision due, unfinished pathways, recent chats", icon: CalendarDays, run: () => openView("today") },
      { key: "a:medrec", label: "Med Reconciliation: before and after medicines", hint: "Admission, transfer or discharge; a patient medicine sheet", icon: Pill, run: () => openView("medrec") },
      { key: "a:discharge", label: "Discharge Summary: write it from the case notes", hint: "Typed notes or case-sheet photos; patient advice in their language", icon: FileOutput, run: () => openView("discharge") },
      { key: "a:handover", label: "Shift Handover: I-PASS for the next team", hint: "From your ward list, with if/then plans", icon: ArrowRightLeft, run: () => openView("handover") },
      { key: "a:ddx", label: "Differential Builder: ranked differential from findings", hint: "Can't-miss diagnoses and the next tests", icon: Waypoints, run: () => openView("ddx") },
      { key: "a:studyplan", label: "Exam Study Planner: a day-by-day plan to your exam", hint: "NEET-PG, INI-CET, FMGE or university", icon: CalendarCheck, run: () => openView("studyplan") },
      { key: "a:podcasts", label: "Revision Podcasts: a topic as a two-voice audio lesson", hint: "Natural voices; from a topic or a flashcard deck", icon: Headphones, run: () => openView("podcasts") },
      { key: "a:ecg", label: "ECG Reader: read an ECG photo", hint: "Rate, rhythm, axis, intervals; STEMI and other urgent patterns flagged", icon: Activity, run: () => openView("ecg") },
      { key: "a:abx", label: "Antibiotic Guide: empiric antibiotics", hint: "ICMR-based, adjusted for kidneys, allergy and your hospital policy", icon: Bug, run: () => openView("abx") },
      { key: "a:procedure", label: "Procedure Guide and consent", hint: "LP, central line, chest drain, ascitic tap and more", icon: ListChecks, run: () => openView("procedure") },
      { key: "a:poison", label: "Poisoning and snakebite", hint: "Antidotes, ASV, organophosphate, celphos, paracetamol", icon: FlaskRound, run: () => openView("poison") },
      { key: "a:infusions", label: "Infusions: dose to mL/h", hint: "Noradrenaline, insulin, heparin, sedation; drip rates", icon: Syringe, run: () => openView("infusions") },
      { key: "a:convert", label: "Dose Converter: steroids and opioids", hint: "Equivalent doses and opioid switches", icon: Scale, run: () => openView("convert") },
      { key: "a:abg", label: "ABG Interpreter", hint: "Step by step: compensation, anion gap, delta ratio", icon: Wind, run: () => openView("abg") },
      { key: "a:logbook", label: "PG Logbook", hint: "Log procedures, cases and duties; print or export", icon: BookCheck, run: () => openView("logbook") },
      { key: "a:followups", label: "Follow-ups", hint: "Patients to review on a date", icon: CalendarClock, run: () => openView("followups") },
      { key: "a:voiceviva", label: "Voice Viva: an examiner asks aloud, you answer by speaking", hint: "Scored at the end", icon: MicVocal, run: () => void startVoice("viva") },
      { key: "a:voiceosce", label: "Voice OSCE: take a history by talking to the patient", hint: "The patient answers in their own voice; examiner feedback at the end", icon: Speech, run: () => void startVoice("osce") },
      { key: "a:audiolib", label: "Patient Audio Library: spoken explainers in 13 languages", hint: "Diabetes, ORS, TB, insulin, pregnancy danger signs; WhatsApp", icon: FileAudio, run: () => openView("audiolib") },
      { key: "a:rxwrite", label: "Prescription Writer: draft a prescription from the diagnosis", hint: "Doses for age, weight and kidneys; advice in the patient's language", icon: FilePen, run: () => openView("rxwrite") },
      { key: "a:labtrend", label: "Lab Trends: chart serial results from report photos", hint: "Explained test by test, with what to do next", icon: ChartLine, run: () => openView("labtrend") },
      { key: "a:daily", label: "Daily Clinical Case: today's case and five questions", hint: "A streak, and a score to share with your batch", icon: CalendarHeart, run: () => openView("daily") },
      { key: "a:letters", label: "Letters and certificates: referral, fitness, leave, insurance", hint: "PM-JAY and TPA pre-authorisation; on your letterhead", icon: ScrollText, run: () => openView("letters") },
      { key: "a:adr", label: "ADR Report: fill the PvPI adverse reaction form", hint: "WHO-UMC causality and management", icon: ShieldAlert, run: () => openView("adr") },
      { key: "a:mccd", label: "Cause of Death: write the MCCD sequence correctly", hint: "Immediate, antecedent and underlying causes with ICD-10", icon: FileSignature, run: () => openView("mccd") },
      { key: "a:mnemonics", label: "Mnemonic Maker: remember any list", hint: "Classic or new mnemonics, saved to flashcards", icon: Brain, run: () => openView("mnemonics") },
      { key: "a:generics", label: "Generic Finder: brand names to generics", hint: "NLEM status, other brands and the usual dose", icon: PillBottle, run: () => openView("generics") },
      { key: "a:opd", label: "OPD Queue: today's patients with tokens", hint: "Call next, vitals, token board; straight to the prescription", icon: ListOrdered, run: () => openView("opd") },
      { key: "a:imagequiz", label: "Clinical Image Quiz: your X-rays and ECGs as questions", hint: "Play it, or send your batch one page", icon: Images, run: () => openView("imagequiz") },
      { key: "a:dosecard", label: "Dose Card: every emergency dose for a weight", hint: "Tube size, fluids, common medicines; print it", icon: Weight, run: () => openView("dosecard") },
      { key: "a:mocks", label: "Mock Tests: timed papers by subject", hint: "25, 50 or 100 questions, scored like NEET-PG", icon: Timer, run: () => openPractice("mock") },
      { key: "a:oncall", label: "On-call Helper: the ward is calling", hint: "See now or not, orders, don't miss, when to escalate", icon: PhoneCall, run: () => openView("oncall") },
      { key: "a:journal", label: "Journal Club: appraise a paper", hint: "CASP checklist, results, bias, slides", icon: BookOpenText, run: () => openView("journal") },
      { key: "a:stats", label: "Statistics: which test to use", hint: "With SPSS steps and how to report it", icon: Sigma, run: () => openView("stats") },
      { key: "a:roster", label: "Duty Roster: a fair on-call roster", hint: "Weekends shared, leave respected; print or Excel", icon: CalendarRange, run: () => openView("roster") },
      { key: "a:records", label: "Patient Records: a file for each patient", hint: "Visits, vitals over time, a summary before the visit", icon: FolderHeart, run: () => openView("records") },
      { key: "a:voiceround", label: "Ward Rounds by Voice: dictate at each bed", hint: "Updates the ward list and writes the progress note", icon: AudioWaveform, run: () => openView("voiceround") },
      { key: "a:revnotes", label: "Revision Notes: high-yield notes for exams", hint: "Flashcards, questions, revision after 1, 3, 7, 21 days", icon: NotebookPen, run: () => openView("revnotes") },
      { key: "a:analytics", label: "Clinic Analytics: how your clinic is running", hint: "Patients per day, waiting times, top complaints and medicines", icon: BarChart3, run: () => openView("analytics") },
      { key: "a:preop", label: "Pre-op Assessment: pre-anaesthetic check-up", hint: "ASA, RCRI, tests needed, medicines before surgery", icon: ClipboardPlus, run: () => openView("preop") },
      { key: "a:messages", label: "Patient Messages: reminders in the patient's language", hint: "Appointments, reports, fasting, medicines; WhatsApp", icon: MessageSquareText, run: () => openView("messages") },
      { key: "a:preglact", label: "Pregnancy and breastfeeding: is this medicine safe?", hint: "By trimester or while breastfeeding, with alternatives", icon: Baby, run: () => openView("preglact") },
      { key: "a:pillchart", label: "Pill Chart: a picture chart of the medicines", hint: "Sunrise, sun, sunset and moon; for patients who don't read", icon: Sun, run: () => openView("pillchart") },
      { key: "a:vaccines", label: "Vaccination Scheduler: every child's vaccines", hint: "UIP or IAP from the date of birth; card and reminders", icon: Syringe, run: () => openView("vaccines") },
      { key: "a:diet", label: "Diet Chart Maker: a diet chart for the patient", hint: "Diabetes, CKD, pregnancy, weight; Indian foods, their language", icon: Salad, run: () => openView("diet") },
      { key: "a:icd", label: "ICD-10 Coder: codes from a discharge summary", hint: "Principal diagnosis first, for records and PM-JAY claims", icon: FileCode2, run: () => openView("icd") },
      { key: "a:consent", label: "Consent Form Writer: informed consent in two languages", hint: "Risks with frequencies, alternatives, signatures; refusal forms", icon: FileSignature, run: () => openView("consent") },
      { key: "a:insulin", label: "Insulin Planner: starting doses by weight", hint: "Basal, basal-bolus or premix; correction scale and chart", icon: Pipette, run: () => openView("insulin") },
      { key: "a:transfusion", label: "Blood Transfusion: how much, how fast, reactions", hint: "Red cells, platelets, FFP and cryo by weight", icon: Droplet, run: () => openView("transfusion") },
      { key: "a:mlc", label: "MLC Injury Report: a medico-legal injury report", hint: "Each injury, its age, the weapon and simple or grievous (BNS)", icon: Gavel, run: () => openView("mlc") },
      { key: "a:tb", label: "TB Treatment (NTEP): tablets and dates", hint: "Weight band, phase dates, sputum checks and a patient card", icon: Microscope, run: () => openView("tb") },
      { key: "a:antenatal", label: "Antenatal Care Tracker: every pregnancy you follow", hint: "EDD, visits, BP and Hb, risk flags, what is due; a card", icon: Heart, run: () => openView("antenatal") },
      { key: "a:ventilator", label: "Ventilator Helper: starting settings and ABG changes", hint: "Tidal volume by height, FiO₂/PEEP table, what to change", icon: Fan, run: () => openView("ventilator") },
      { key: "a:teleconsult", label: "Teleconsultation Note: record and e-prescription", hint: "Telemedicine Practice Guidelines 2020; medicine lists checked", icon: Video, run: () => openView("teleconsult") },
      { key: "a:bills", label: "Clinic Bills & Receipts: OPD receipts", hint: "Numbered receipts, cash/UPI/card, the day's total, CSV", icon: ReceiptIndianRupee, run: () => openView("bills") },
      { key: "a:bite", label: "Animal Bite: rabies post-exposure prophylaxis", hint: "Category, wound care, vaccine dates and immunoglobulin dose", icon: Dog, run: () => openView("bite") },
      { key: "a:needlestick", label: "Needle-stick Injury: what to do now", hint: "First aid, HIV PEP, hepatitis B by immunity, follow-up tests", icon: Bandage, run: () => openView("needlestick") },
      { key: "a:imnci", label: "IMNCI Sick Child: classify and treat", hint: "Danger signs, pneumonia, diarrhoea, fever; doses by weight", icon: Thermometer, run: () => openView("imnci") },
      { key: "a:cme", label: "CME Credits: hours towards renewal", hint: "Every CME with certificates; progress for your council", icon: Award, run: () => openView("cme") },
      { key: "a:appointments", label: "Appointments: the clinic's booking book", hint: "Slots from your hours, WhatsApp reminders, arrivals into the OPD queue", icon: CalendarPlus, run: () => openView("appointments") },
      { key: "a:stock", label: "Pharmacy Stock: medicines and expiry", hint: "Stock in and out, low and near-expiry alerts, reorder list", icon: Warehouse, run: () => openView("stock") },
      { key: "a:screening", label: "Mental Health Screening: PHQ-9, GAD-7, AUDIT-C", hint: "Scores, severity, next steps and a safety check", icon: HeartHandshake, run: () => openView("screening") },
      { key: "a:kidney", label: "Kidney Dose Adjuster: doses in CKD", hint: "Cockcroft-Gault, common medicines by band, Cadus for others", icon: Bean, run: () => openView("kidney") },
      { key: "a:sam", label: "Malnutrition (SAM): classify and treat", hint: "MUAC, oedema, appetite test, F-75 and F-100 by weight", icon: Ruler, run: () => openView("sam") },
      { key: "a:contacts", label: "Referral Contacts: who you refer to", hint: "Specialists, hospitals, labs and ambulances; one-tap call", icon: ContactRound, run: () => openView("contacts") },
      { key: "a:accounts", label: "Clinic Accounts: the month's income and expenses", hint: "Receipts in, expenses out, the net and the biggest costs", icon: Wallet, run: () => openView("accounts") },
      { key: "a:thyroid", label: "Thyroid Dose Helper: levothyroxine", hint: "Starting dose, change by TSH, pregnancy targets", icon: Gauge, run: () => openView("thyroid") },
      { key: "a:backup", label: "Backup & Restore: all your Cadus data", hint: "One file for chats, records, receipts, stock; optional passphrase", icon: DatabaseBackup, run: () => openView("backup") },
      { key: "a:ncd", label: "BP & Sugar Protocols: hypertension and diabetes steps", hint: "IHCI hypertension steps, diabetes add-ons by comorbidity, targets", icon: TrendingUp, run: () => openView("ncd") },
      { key: "a:anaemia", label: "Anaemia & Iron: grade and iron dose", hint: "WHO grades, oral iron, Ganzoni deficit, FCM and iron sucrose", icon: Droplets, run: () => openView("anaemia") },
      { key: "a:dengue", label: "Dengue Helper: group and fluids", hint: "Warning signs, WHO groups, crystalloid rates by weight", icon: BugOff, run: () => openView("dengue") },
      { key: "a:electrolytes", label: "Electrolyte Replacement: K, Na, Mg, Ca", hint: "How much, how fast, safe sodium correction limits", icon: FlaskConical, run: () => openView("electrolytes") },
      { key: "a:obsemergency", label: "Obstetric Emergencies: eclampsia, PPH and more", hint: "Magnesium sulphate with a timer, severe BP, PPH, cord, dystocia", icon: Ambulance, run: () => openView("obsemergency") },
      { key: "a:infection", label: "Infection Control & Waste: bins and isolation", hint: "BMW Rules 2016 colour coding, isolation by disease", icon: Biohazard, run: () => openView("infection") },
      { key: "a:asthma", label: "Asthma & COPD Plans: GINA, GOLD and an action plan", hint: "Treatment step, inhaler technique, plan in the patient's language", icon: Wind, run: () => openView("asthma") },
      { key: "a:milestones", label: "Developmental Milestones: what by when", hint: "Four domains, corrected age, red flags, a parent handout", icon: PersonStanding, run: () => openView("milestones") },
      { key: "a:contraception", label: "Contraception Advisor: which methods are safe", hint: "Key WHO MEC rules, how to start each, emergency contraception", icon: Ribbon, run: () => openView("contraception") },
      { key: "a:palliative", label: "Palliative Care Helper: morphine and symptoms", hint: "Morphine titration, breakthrough and SC doses, end-of-life symptoms", icon: HandHeart, run: () => openView("palliative") },
      { key: "a:imaging", label: "Imaging Decision Rules: Ottawa and Canadian", hint: "When an X-ray or CT is needed after an injury", icon: ScanLine, run: () => openView("imaging") },
      { key: "a:ivfluids", label: "IV Fluids Planner: adult fluids", hint: "Resuscitation bolus, maintenance water, electrolytes, glucose", icon: Droplet, run: () => openView("ivfluids") },
      { key: "a:sickday", label: "Sick-Day Rules: medicines when unwell", hint: "SADMANS, steroids and insulin; a handout in their language", icon: ThermometerSun, run: () => openView("sickday") },
      { key: "a:labranges", label: "Lab Reference Ranges: normal values", hint: "Typical adult ranges for common tests", icon: TestTubes, run: () => openView("labranges") },
      { key: "a:burns", label: "Burns Helper: TBSA and Parkland fluids", hint: "Lund and Browder by age, fluids from the time of the burn, referral", icon: Flame, run: () => openView("burns") },
      { key: "a:jaundice", label: "Neonatal Jaundice: phototherapy or not", hint: "NICE thresholds by hours of age, rate of rise, what to do", icon: Lightbulb, run: () => openView("jaundice") },
      { key: "a:stroke", label: "Stroke & Thrombolysis: the clock and the dose", hint: "Last known well, alteplase or tenecteplase by weight, NIHSS, exclusions", icon: Brain, run: () => openView("stroke") },
      { key: "a:bundles", label: "Sepsis & DKA Bundles: hour-1 and DKA protocol", hint: "Time-stamped sepsis bundle, qSOFA, DKA insulin, fluids and potassium", icon: HeartPulse, run: () => openView("bundles") },
      { key: "a:alcohol", label: "Alcohol Withdrawal: CIWA-Ar and a reducing course", hint: "Symptom-triggered benzodiazepine, chlordiazepoxide taper, thiamine", icon: Wine, run: () => openView("alcohol") },
      { key: "a:dfoot", label: "Diabetic Foot: infection, risk and foot care", hint: "IWGDF infection grade and antibiotics, Wagner, ABI, screening interval, handout", icon: Footprints, run: () => openView("dfoot") },
      { key: "a:heat", label: "Heat Illness: heat stroke and the heat index", hint: "Cramps, exhaustion or heat stroke with cooling; heat index; handout", icon: Sun, run: () => openView("heat") },
      { key: "a:wound", label: "Wound & Suture Care: suture, tetanus, anaesthetic", hint: "Suture size and removal by site, tetanus table, LA maximum, aftercare sheet", icon: Bandage, run: () => openView("wound") },
      { key: "a:anticoag", label: "Warfarin & Anticoagulation: INR and DOAC doses", hint: "Warfarin dose from the INR, high INR and bleeding, DOACs by kidney function, stopping before surgery", icon: Syringe, run: () => openView("anticoag") },
      { key: "a:fevers", label: "Tropical Fevers: malaria, typhoid, scrub typhus", hint: "Tests by day of fever, NVBDCP malaria doses, typhoid, scrub typhus, leptospirosis", icon: Bug, run: () => openView("fevers") },
      { key: "a:elderly", label: "Elderly Care: frailty, delirium, falls", hint: "Clinical Frailty Scale, 4AT, falls and orthostatic BP, deprescribing", icon: Accessibility, run: () => openView("elderly") },
      { key: "a:quitsmoking", label: "Quit Smoking Helper: NRT and a quit plan", hint: "Fagerström score, NRT, varenicline, bupropion, a quit plan in their language", icon: CigaretteOff, run: () => openView("quitsmoking") },
      { key: "a:croup", label: "Croup & Child Asthma: severity and doses", hint: "Westley croup score, dexamethasone and adrenaline, acute asthma in children", icon: AirVent, run: () => openView("croup") },
      { key: "a:rheumatic", label: "Rheumatic Fever: Jones criteria and prophylaxis", hint: "Revised Jones criteria, acute treatment, penicillin prophylaxis end date", icon: HeartCrack, run: () => openView("rheumatic") },
      { key: "a:weight", label: "Weight Management: Asian BMI and calories", hint: "BMI with Asian cut-offs, waist, calorie target, medicines and surgery thresholds", icon: Scale, run: () => openView("weight") },
      { key: "a:hypo", label: "Hypoglycaemia: what to give now", hint: "Adult, child and newborn treatment by glucose and weight, GIR", icon: Candy, run: () => openView("hypo") },
      { key: "a:gdm", label: "Gestational Diabetes: DIPSI and treatment", hint: "DIPSI or IADPSG diagnosis, targets, metformin or insulin doses, delivery", icon: Droplets, run: () => openView("gdm") },
      { key: "a:infantfeed", label: "Infant Feeding: volumes and weaning", hint: "Milk by day of life and weight, formula scoops, weight loss, complementary feeding", icon: Milk, run: () => openView("infantfeed") },
      { key: "a:antidep", label: "Antidepressant Switcher: switch and stop safely", hint: "Starting doses, direct switch, cross-taper or washout, stopping", icon: Repeat, run: () => openView("antidep") },
      { key: "a:eyeent", label: "Eye & ENT Triage: red eye, nosebleed, sore throat", hint: "Red flags, common causes, epistaxis steps, ear problems, Centor score", icon: Eye, run: () => openView("eyeent") },
      { key: "a:vte", label: "VTE Prophylaxis: Padua and enoxaparin", hint: "Padua score, bleeding contraindications, enoxaparin by weight and CrCl", icon: ShieldPlus, run: () => openView("vte") },
      { key: "a:headache", label: "Headache & Migraine: red flags and prevention", hint: "Red flags, medication overuse, acute treatment and prophylaxis", icon: BrainCircuit, run: () => openView("headache") },
      { key: "a:skin", label: "Skin Infections: scabies, tinea, cellulitis", hint: "Scabies with a handout, tinea, impetigo, cellulitis, shingles", icon: Hand, run: () => openView("skin") },
      { key: "a:gout", label: "Gout & Uric Acid: flare and allopurinol", hint: "Flare by kidney function, when to start, allopurinol titration to target", icon: Bone, run: () => openView("gout") },
      { key: "a:pnuti", label: "Pneumonia & UTI Antibiotics: CURB-65 and UTI choices", hint: "CURB-65 with antibiotics by setting; cystitis, pyelonephritis, pregnancy, catheter, child", icon: Pill, run: () => openView("pnuti") },
      { key: "a:ckd", label: "CKD Care: KDIGO stage and treatment", hint: "CKD-EPI eGFR, KDIGO risk, ACEi/ARB, SGLT2i, finerenone, checks, referral", icon: Bean, run: () => openView("ckd") },
      { key: "a:preterm", label: "Preterm Labour: steroids, magnesium, tocolysis", hint: "By gestation: steroids, magnesium, nifedipine, PPROM and GBS antibiotics, birth", icon: Hourglass, run: () => openView("preterm") },
      { key: "a:epilepsy", label: "Epilepsy & First Seizure: work-up and drug choice", hint: "First-seizure work-up, antiseizure medicine by type, sex and pregnancy, doses, driving", icon: Zap, run: () => openView("epilepsy") },
      { key: "a:childfever", label: "Fever in Under-5s: NICE traffic light", hint: "Green, amber, red features, antipyretic doses, safety-net handout", icon: Thermometer, run: () => openView("childfever") },
      { key: "a:cirrhosis", label: "Cirrhosis & Ascites: MELD-Na and SBP", hint: "Child-Pugh, MELD-Na, SBP antibiotics and albumin, paracentesis albumin, complications", icon: FlaskRound, run: () => openView("cirrhosis") },
      { key: "a:dementia", label: "Dementia & Memory: Mini-Cog and medicines", hint: "Mini-Cog screen, reversible causes, donepezil and memantine, planning", icon: BrainCog, run: () => openView("dementia") },
      { key: "a:htnemergency", label: "Hypertensive Emergency: targets and drugs", hint: "Urgency vs emergency, BP target by condition, labetalol, nicardipine, GTN, esmolol", icon: Gauge, run: () => openView("htnemergency") },
      { key: "a:ugib", label: "Upper GI Bleed & H. pylori: Blatchford and treatment", hint: "Glasgow-Blatchford, resuscitation, PPI, varices, H. pylori regimens", icon: Activity, run: () => openView("ugib") },
      { key: "a:aki", label: "Acute Kidney Injury: KDIGO stage and plan", hint: "AKI stage by creatinine and urine, causes, drugs to stop, dialysis triggers", icon: FlaskConical, run: () => openView("aki") },
      { key: "a:hepbc", label: "Hepatitis B & C: serology and treatment", hint: "HBV panel meaning, APRI, tenofovir or entecavir, vaccination, HCV sofosbuvir regimens", icon: ShieldCheck, run: () => openView("hepbc") },
      { key: "a:nrp", label: "Newborn Resuscitation: timer and doses", hint: "Clock from birth, NRP steps, SpO2 targets, tube size, adrenaline and fluid by weight", icon: Baby, run: () => openView("nrp") },
      { key: "a:pain", label: "Pain Relief Planner: analgesia by patient", hint: "Paracetamol, NSAIDs, tramadol, opioids and neuropathic agents by kidney, GI, heart and age", icon: PillBottle, run: () => openView("pain") },
      { key: "a:bone", label: "Osteoporosis & Bone Health: T-score and treatment", hint: "T-score category, FRAX and steroid thresholds, bisphosphonates, denosumab, calcium and vitamin D", icon: Bone, run: () => openView("bone") },
      { key: "a:hrt", label: "Menopause & HRT: regimen and alternatives", hint: "Diagnosis by age, contraindications, route and progestogen, vaginal oestrogen, non-hormonal options", icon: Flower2, run: () => openView("hrt") },
      { key: "a:syncope", label: "Syncope: ESC risk features", hint: "High-risk history and ECG features, reflex features, admit, observe or discharge", icon: HeartPulse, run: () => openView("syncope") },
      { key: "a:hf", label: "Heart Failure GDMT: four pillars and titration", hint: "ARNI, beta-blocker, MRA, SGLT2i next steps by BP, HR, K and eGFR; diuretics", icon: HeartPulse, run: () => openView("hf") },
      { key: "a:af", label: "Atrial Fibrillation: stroke risk, rate and rhythm", hint: "CHA2DS2-VA, HAS-BLED, anticoagulant, rate control doses, cardioversion rules", icon: Activity, run: () => openView("af") },
      { key: "a:lipids", label: "Lipids & CV Risk: LDL target and statin plan", hint: "LAI risk category, LDL target, % reduction, statin intensity, ezetimibe, triglycerides", icon: Droplets, run: () => openView("lipids") },
      { key: "a:pedvt", label: "PE & DVT: Wells, D-dimer and treatment", hint: "Wells, PERC, YEARS, age-adjusted D-dimer, sPESI, anticoagulation and duration", icon: Waves, run: () => openView("pedvt") },
      { key: "a:hiv", label: "HIV Care: starting ART (NACO)", hint: "TLD and alternatives, timing with TB or meningitis, baseline, CPT, TPT, viral load", icon: Ribbon, run: () => openView("hiv") },
      { key: "a:preeclampsia", label: "Pre-eclampsia: aspirin and diagnosis", hint: "Risk factors and aspirin 150 mg, diagnosis and severity, antihypertensives, delivery", icon: Baby, run: () => openView("preeclampsia") },
      { key: "a:sleep", label: "Insomnia & Sleep: STOP-BANG and CBT-I", hint: "Sleep apnoea screen, sleep efficiency and window, medicines, sleep handout", icon: Moon, run: () => openView("sleep") },
      { key: "a:urticaria", label: "Urticaria & Angioedema: steps and red flags", hint: "Acute and chronic urticaria, up-dosing, omalizumab, UAS7, angioedema flags", icon: CircleDot, run: () => openView("urticaria") },
      { key: "a:anaphylaxis", label: "Anaphylaxis & Allergy Plan: adrenaline and action plan", hint: "IM adrenaline by age and weight, refractory steps, observation, written allergy plan", icon: Siren, run: () => openView("anaphylaxis") },
      { key: "a:trauma", label: "Trauma Primary Survey: ABCDE with a clock", hint: "Time-stamped <C>ABCDE, shock class, ABC score, GCS, tranexamic acid", icon: Ambulance, run: () => openView("trauma") },
      { key: "a:tox", label: "Toxicology: paracetamol and organophosphate", hint: "Paracetamol line and NAC doses, atropine doubling, pralidoxime, Indian poisons", icon: FlaskConical, run: () => openView("tox") },
      { key: "a:ptx", label: "Pneumothorax & Chest Drain: BTS pathway", hint: "Conservative, aspiration or drain by BTS 2023; tension; chest drain steps", icon: Wind, run: () => openView("ptx") },
      { key: "a:fluids", label: "Body Fluid Analysis: pleural, ascitic, CSF, synovial", hint: "Light's criteria, ADA, SAAG, SBP, CSF patterns, synovial counts", icon: TestTube, run: () => openView("fluids") },
      { key: "a:steroid", label: "Adrenal Crisis & Steroid Cover", hint: "Steroid equivalents, who is at risk, surgical and labour cover, adrenal crisis", icon: Syringe, run: () => openView("steroid") },
      { key: "a:refeed", label: "Refeeding & Nutrition: risk and calorie ramp", hint: "NICE refeeding risk, starting kcal/kg, day-by-day ramp, thiamine and electrolytes", icon: Utensils, run: () => openView("refeed") },
      { key: "a:backpain", label: "Back Pain & Cauda Equina: red flags", hint: "Cauda equina symptoms, red flags including spinal TB, emergency, urgent or routine plan", icon: Bone, run: () => openView("backpain") },
      { key: "a:acs", label: "Chest Pain & ACS: HEART score and STEMI", hint: "HEART score, STEMI ECG criteria, PCI or fibrinolysis, tenecteplase and enoxaparin doses", icon: HeartPulse, run: () => openView("acs") },
      { key: "a:childfluids", label: "Child Fluids & Dehydration: WHO plans", hint: "WHO dehydration plans A, B and C, Holliday–Segar maintenance, deficit and shock bolus by weight", icon: GlassWater, run: () => openView("childfluids") },
      { key: "a:agitation", label: "Agitation & Rapid Tranquillisation", hint: "Behavioural activity scale, de-escalation, oral and IM options adjusted for age and risks, monitoring", icon: ShieldAlert, run: () => openView("agitation") },
      { key: "a:suicide", label: "Suicide Risk & Safety Plan", hint: "Columbia screening questions with triage, factors to explore, printable safety plan, Tele-MANAS", icon: LifeBuoy, run: () => openView("suicide") },
      { key: "a:headinjury", label: "Head Injury & CT Rules: NICE and PECARN", hint: "Who needs CT head and how fast: NICE adults, PECARN children, discharge advice", icon: Brain, run: () => openView("headinjury") },
      { key: "a:abdomen", label: "Acute Abdomen & Appendicitis scores", hint: "Red flags, Alvarado, Paediatric Appendicitis Score, BISAP for pancreatitis", icon: Stethoscope, run: () => openView("abdomen") },
      { key: "a:fneutro", label: "Febrile Neutropenia: MASCC and antibiotics", hint: "Neutrophil count, MASCC risk score, oral or IV empirical antibiotics within an hour", icon: ShieldPlus, run: () => openView("fneutro") },
      { key: "a:meningitis", label: "Meningitis & Encephalitis: empirical treatment", hint: "CT before LP, empirical antibiotics and acyclovir by age and weight, dexamethasone, contact prophylaxis", icon: Bug, run: () => openView("meningitis") },
      { key: "a:statusepi", label: "Status Epilepticus: timed pathway", hint: "Clock from seizure onset, benzodiazepines, levetiracetam, phenytoin, valproate, refractory status", icon: Zap, run: () => openView("statusepi") },
      { key: "a:sodium", label: "Hyponatraemia & Sodium: cause and safe correction", hint: "Corrected sodium, osmolality, urine tests, Adrogue-Madias, 3% saline, Furst ratio, limits", icon: FlaskConical, run: () => openView("sodium") },
      { key: "a:attack", label: "Asthma & COPD Attack: severity and treatment", hint: "Adult and child asthma severity, nebulisers, steroids, magnesium, COPD exacerbation, NIV criteria", icon: Wind, run: () => openView("attack") },
      { key: "a:bridging", label: "Pre-op Risk & Anticoagulant Bridging", hint: "RCRI, METs, when to stop and restart DOACs, warfarin bridging, antiplatelets and stents", icon: ClipboardCheck, run: () => openView("bridging") },
      { key: "a:oncoemerg", label: "Oncology Emergencies: hypercalcaemia, TLS, MSCC", hint: "Corrected calcium and treatment, Cairo-Bishop TLS, rasburicase, cord compression, SVC obstruction", icon: Ribbon, run: () => openView("oncoemerg") },
      { key: "a:spirometry", label: "Spirometry Interpreter", hint: "FEV1/FVC, obstruction or restriction, GOLD grade, bronchodilator reversibility", icon: Gauge, run: () => openView("spirometry") },
      { key: "a:thyroidstorm", label: "Thyroid Storm & Myxoedema Coma", hint: "Burch-Wartofsky score, propranolol, PTU, iodine, hydrocortisone, IV levothyroxine", icon: Thermometer, run: () => openView("thyroidstorm") },
      { key: "a:sickle", label: "Sickle Cell & Thalassaemia care", hint: "Pain crisis, danger signs, hydroxyurea dosing, transfusion volume, iron chelation", icon: Droplets, run: () => openView("sickle") },
      { key: "a:hyperk", label: "Hyperkalaemia & ECG: protect, shift, remove", hint: "Potassium bands, ECG changes, calcium, insulin-glucose, salbutamol, binders, dialysis", icon: HeartPulse, run: () => openView("hyperk") },
      { key: "a:pancreatitis", label: "Acute Pancreatitis Plan: severity and management", hint: "Ranson, revised Atlanta, WATERFALL fluids, early feeding, antibiotics, ERCP, step-up", icon: Stethoscope, run: () => openView("pancreatitis") },
      { key: "a:paedsepsis", label: "Paediatric Sepsis & Shock: Phoenix score", hint: "Phoenix 2024 criteria by age, antibiotics, fluid boluses, inotropes and hydrocortisone by weight", icon: Baby, run: () => openView("paedsepsis") },
      { key: "a:airway", label: "Upper Airway & Stridor emergencies", hint: "Foreign body, epiglottitis, angio-oedema, deep neck infection, tracheostomy and post-extubation stridor", icon: Wind, run: () => openView("airway") },
      { key: "a:rhabdo", label: "Rhabdomyolysis & CK: McMahon score", hint: "McMahon risk of dialysis or death, causes, fluids to urine output, potassium, compartment syndrome", icon: Bone, run: () => openView("rhabdo") },
      { key: "a:hypothermia", label: "Hypothermia & Drowning", hint: "Swiss staging, rewarming, cardiac arrest below 30 degrees, drowning resuscitation and discharge", icon: Snowflake, run: () => openView("hypothermia") },
      { key: "a:paeddka", label: "Paediatric DKA: BSPED fluids and insulin", hint: "Severity, bolus, deficit plus maintenance hourly rate, insulin 0.05-0.1 units/kg/hour, cerebral oedema", icon: Droplet, run: () => openView("paeddka") },
      { key: "a:retention", label: "Acute Urinary Retention: catheter and TWOC", hint: "Catheter choice, residual volume, post-obstructive diuresis, tamsulosin, causes and red flags", icon: Droplets, run: () => openView("retention") },
      { key: "a:preghtn", label: "Hypertension in Pregnancy & Postpartum", hint: "Labetalol, nifedipine, hydralazine for severe BP, Zuspan and Pritchard magnesium, toxicity checks, postpartum BP", icon: Baby, run: () => openView("preghtn") },
      { key: "a:stones", label: "Kidney Stones & Colic: plan by size and site", hint: "Infected obstructed kidney, analgesia, tamsulosin, ureteroscopy, SWL, PCNL and prevention", icon: Droplets, run: () => openView("stones") },
      { key: "a:paedabx", label: "Children's Antibiotics by Weight", hint: "Dose per dose and syrup volume for otitis, sore throat, pneumonia, UTI, cellulitis, dysentery, typhoid, scrub typhus", icon: Baby, run: () => openView("paedabx") },
      { key: "a:opioid", label: "Opioid Conversion & Syringe Driver", hint: "Oral morphine equivalents, fentanyl and buprenorphine patches, breakthrough doses, 24-hour syringe driver", icon: Syringe, run: () => openView("opioid") },
      { key: "a:cellulitis", label: "Cellulitis & Necrotising Fasciitis: LRINEC", hint: "Red flags for necrotising infection, LRINEC score, oral or IV antibiotics, surgery", icon: Bandage, run: () => openView("cellulitis") },
      { key: "a:kawasaki", label: "Kawasaki Disease: criteria and IVIG", hint: "Complete and incomplete Kawasaki disease, supplementary labs, IVIG 2 g/kg, aspirin, echo follow-up", icon: Baby, run: () => openView("kawasaki") },
      { key: "a:endocarditis", label: "Infective Endocarditis: Duke criteria", hint: "Modified Duke criteria, empirical antibiotics for native and prosthetic valves, surgery indications", icon: HeartPulse, run: () => openView("endocarditis") },
      { key: "a:bell", label: "Bell's Palsy & Facial Weakness", hint: "Stroke and other red flags, prednisolone within 72 hours, Ramsay Hunt, eye care, House-Brackmann", icon: Smile, run: () => openView("bell") },
      { key: "a:pph", label: "Postpartum Haemorrhage: drugs and steps", hint: "Shock index, 4 Ts, oxytocin, tranexamic acid, carboprost, misoprostol, balloon, massive transfusion", icon: Droplet, run: () => openView("pph") },
      { key: "a:neosepsis", label: "Neonatal Sepsis & Antibiotics", hint: "NICE risk framework, ampicillin and gentamicin by gestation and postnatal age, duration", icon: Baby, run: () => openView("neosepsis") },
      { key: "a:renalabx", label: "Antibiotic Renal Dosing by CrCl", hint: "Cockcroft-Gault, meropenem, pip-taz, vancomycin, gentamicin and more by CrCl or dialysis", icon: FlaskConical, run: () => openView("renalabx") },
      { key: "a:braindeath", label: "Brain-stem Death & Organ Donation (India)", hint: "Preconditions, brain-stem reflexes, apnoea test, Form 10, board of four, donor management targets", icon: HeartHandshake, run: () => openView("braindeath") },
      { key: "a:septicjoint", label: "Septic Arthritis & Hot Joint: Kocher", hint: "Kocher criteria, aspiration, empirical antibiotics for children and adults, gonococcal, prosthetic joint", icon: Bone, run: () => openView("septicjoint") },
      { key: "a:neohypo", label: "Neonatal Hypoglycaemia: gel and GIR", hint: "Who to screen, feed, 40% dextrose gel, IV 10% dextrose bolus and infusion, glucose infusion rate", icon: Baby, run: () => openView("neohypo") },
      { key: "a:altitude", label: "Altitude Illness: AMS, HACE, HAPE", hint: "Lake Louise score, acetazolamide prevention, dexamethasone, nifedipine, descent, Ladakh advice", icon: Mountain, run: () => openView("altitude") },
      { key: "a:serotonin", label: "Serotonin Syndrome vs NMS", hint: "Hunter criteria, NMS features, cyproheptadine, bromocriptine, dantrolene, cooling", icon: Thermometer, run: () => openView("serotonin") },
      { key: "a:paedasthma", label: "Acute Asthma in Children: PRAM", hint: "PRAM severity, salbutamol and ipratropium by weight, prednisolone, magnesium, discharge plan", icon: Baby, run: () => openView("paedasthma") },
      { key: "a:dkahhs", label: "DKA & HHS Adult Timer", hint: "Hourly fluid schedule, fixed-rate insulin 0.1 unit/kg/h, potassium, ketone and glucose targets, HHS plan", icon: Droplet, run: () => openView("dkahhs") },
      { key: "a:ansteroid", label: "Antenatal Steroids & Tocolysis", hint: "Steroid window and rescue course, nifedipine, atosiban, indomethacin, magnesium for neuroprotection", icon: Baby, run: () => openView("ansteroid") },
      { key: "a:ironb12", label: "Iron, B12 & Folate Replacement", hint: "Ganzoni deficit, ferric carboxymaltose or iron sucrose, oral iron, B12 injections, folic acid doses", icon: Pill, run: () => openView("ironb12") },
      { key: "a:tdm", label: "Therapeutic Drug Levels (TDM)", hint: "Digoxin, lithium, phenytoin with albumin correction, valproate, vancomycin, gentamicin, tacrolimus", icon: FlaskConical, run: () => openView("tdm") },
      { key: "a:contrast", label: "Contrast Safety: kidneys and reactions", hint: "eGFR risk, metformin hold, premedication, managing contrast reactions", icon: ScanLine, run: () => openView("contrast") },
      { key: "a:pressure", label: "Pressure Injuries: Braden and staging", hint: "Braden risk score, pressure injury stages, repositioning, dressings", icon: Bed, run: () => openView("pressure") },
      { key: "a:hyperemesis", label: "Hyperemesis Gravidarum: PUQE", hint: "PUQE score, antiemetic ladder, thiamine, IV fluids, admission criteria", icon: Baby, run: () => openView("hyperemesis") },
      { key: "a:present", label: "Presentation Coach: practise presenting a case", hint: "Ward round, long case, SBAR; scored with a model answer", icon: Presentation, run: () => openView("present") },
      { key: "a:compare", label: "Compare over time: what changed between two studies", hint: "X-rays, ECGs, scans, reports and wound photos", icon: History, run: () => openView("compare") },
      { key: "a:newcase", label: "New patient case", hint: "Start a de-identified case sheet", icon: ClipboardList, run: () => { const c = newCase(); setCases((l) => [c, ...l]); openCases(c.id); } },
      { key: "a:pubmed", label: "Search PubMed", hint: "Research", icon: Microscope, run: () => openResearch({ tab: "search" }) },
      { key: "a:reading", label: "Open reading list", icon: BookMarked, run: () => openResearch({ tab: "reading" }) },
      { key: "a:thesis", label: "Thesis kit: sample size and statistical tests", icon: Sigma, run: () => openResearch({ tab: "thesis" }) },
      { key: "a:trends", label: "Chart lab trends", icon: ChartLine, run: () => openCalculators({ tab: "trends" }) },
      { key: "a:letterhead", label: lh ? "Edit your letterhead" : "Set up your letterhead", icon: FileSignature, run: () => openSettings("letterhead") },
      { key: "a:safety", label: "Clinical safety: how answers are checked", icon: ShieldCheck, run: () => setView("safety") },
      { key: "a:history", label: "Answer history", hint: `${audit.length} records`, icon: History, run: () => setView("history") },
      { key: "a:privacy", label: "Privacy centre", icon: EyeOff, run: () => setView("privacy") },
      { key: "a:tour", label: "Take the tour", icon: Compass, run: () => startTour() },
      { key: "a:setup", label: "Set up Cadus again", hint: "Role, specialty, units", icon: UserCog, run: () => setOnboardOpen(true) },
      { key: "a:institution", label: "Institution protocols", hint: "Local protocols, formulary, team pack", icon: Building2, run: () => openSettings("institution") },
      { key: "a:calc", label: "Open calculators", icon: Calculator, run: () => openCalculators() },
      { key: "a:ix", label: "Open the interaction checker", icon: Pill, run: () => openCalculators({ tab: "ix" }) },
      { key: "a:practice", label: "Open Learn", hint: "Daily set, mocks, syllabus, practice", icon: GraduationCap, run: () => openPractice() },
      { key: "a:profile", label: profile ? "Edit your profile" : "Personalise Cadus", icon: UserCog, run: () => setProfileOpen(true) },
      { key: "a:temp", label: "New temporary chat", hint: "Not saved", icon: MessageSquareDashed, run: () => { newChat(); setTempNext(true); } },
      { key: "a:voice", label: "Start voice mode", icon: AudioLines, run: () => startVoice() },
      { key: "a:think", label: think ? "Turn off Think deeper" : "Think deeper on the next answer", icon: Lightbulb, run: () => { setThink(!think); focusComposer(); } },
      { key: "a:newdoc", label: "New document", hint: "Canvas", icon: FilePen, run: () => newDocument() },
      { key: "a:archived", label: "Archived chats", icon: Archive, run: () => { setArchivedOpen(true); openSettings("data"); } },
      { key: "a:memory", label: "Manage memory and custom instructions", icon: Brain, run: () => openSettings("personal") },
      { key: "a:docs", label: "Open documents", icon: FilePen, run: () => { setLibTab("docs"); setView("library"); } },
      { key: "a:theme", label: dark ? "Switch to light theme" : "Switch to dark theme", icon: dark ? Sun : Moon, run: () => setPrefs((p) => ({ ...p, theme: dark ? "light" : "dark" })) },
      { key: "a:font", label: serif ? "Use sans-serif answers" : "Use serif answers", icon: Palette, run: () => setPrefs((p) => ({ ...p, answerFont: serif ? "sans" : "serif" })) },
      { key: "a:settings", label: "Open settings", icon: Settings, run: () => openSettings() },
      // Anything typed can also be searched on PubMed (listed after the actions it matches).
      ...(q.length > 2 ? [{ key: "a:pubmedq", label: `Search PubMed for “${palQuery.trim()}”`, icon: Microscope, run: () => openResearch({ query: palQuery.trim() }) }] : []),
    ].filter((a) => match(a.label));
    const projectItems: PaletteItem[] = sortedProjects
      .filter((p) => match(p.name))
      .slice(0, 6)
      .map((p) => ({ key: `p:${p.id}`, label: p.name, hint: `${projectStats[p.id]?.chats ?? 0} chats`, icon: Folder, run: () => openProject(p.id) }));
    const tools: PaletteItem[] = TOOL_MODES.filter((m) => match(m.label) || match(m.desc)).map((m) => ({
      key: `t:${m.id}`, label: m.label, hint: m.desc, icon: m.icon, run: () => startTool(m.id),
    }));
    const calcItems: PaletteItem[] = q
      ? CALCULATORS.filter((c) => match(c.name) || match(c.desc)).slice(0, 6).map((c) => ({
        key: `k:${c.id}`, label: c.name, hint: c.desc, icon: Calculator, run: () => openCalculators({ calc: c.id }),
      }))
      : [];
    const chats: PaletteItem[] = sessions
      .filter((s) => !s.temp && (match(s.title) || (q.length > 2 && s.messages.some((m) => m.content.toLowerCase().includes(q)))))
      .slice(0, 8)
      .map((s) => ({ key: `c:${s.id}`, label: s.title, hint: s.archived ? "Archived" : relTime(s.updatedAt), icon: MODE[sessionMode(s)].icon, run: () => openSession(s.id) }));
    return [
      { label: "Chats", items: chats },
      { label: "Projects", items: projectItems },
      { label: "Actions", items: actions },
      { label: "Calculators", items: calcItems },
      { label: "Clinical tools", items: tools },
    ].filter((s) => s.items.length > 0);
  })();
  const palFlat = paletteSections.flatMap((s) => s.items);

  const runPalette = (item?: PaletteItem) => {
    if (!item) return;
    setPaletteOpen(false);
    item.run();
  };

  const openPalette = () => {
    setPaletteOpen(true);
    setPalQuery("");
    setPalIndex(0);
    setSidebarOpen(false);
  };

  /* ------------------------------------------------------- renderers */

  const toolCard = (m: ModeDef, withExample = false) => (
    <button key={m.id} className="cx-card" onClick={() => startTool(m.id)}>
      <span className="cx-card-ic"><m.icon size={18} /></span>
      <b>{m.label}</b>
      <small>{m.desc}</small>
      {withExample && <span className="cx-card-ex">“{m.example}”</span>}
      <span className="cx-card-go">Start <ArrowRight size={14} /></span>
    </button>
  );

  const toolsFiltered = TOOL_MODES.filter((m) => toolTab === "all" || m.cat === toolTab);

  const toolTabs = (
    <div className="cx-tabs" role="tablist">
      {TOOL_TABS.map((t) => (
        <button key={t.id} role="tab" aria-selected={toolTab === t.id} className={toolTab === t.id ? "on" : ""} onClick={() => setToolTab(t.id)}>{t.label}</button>
      ))}
    </div>
  );

  const composer = (placement: "hero" | "dock") => (
    <div ref={composerRef} className={`cx-composer ${placement === "hero" ? "is-hero" : ""} ${listening ? "is-rec" : ""}`}>
      {attachments.length > 0 && (
        <div className="cx-read-pick" role="radiogroup" aria-label="What is attached">
          <span>Read as</span>
          {READINGS.map((r) => (
            <button key={r.id} type="button" role="radio" aria-checked={reading === r.id} className={reading === r.id ? "on" : ""} onClick={() => { if (!limits.reading) { setUpgrade({ reason: "Systematic image and report reading is part of Core and above.", feature: "reading" }); return; } setReading(reading === r.id ? "" : r.id); if (mode === "general" || mode === "image") setMode("image"); }} title={r.hint}>{r.label}</button>
          ))}
        </div>
      )}
      {attachments.length > 0 && (
        <div className="cx-att-row">
          {attachments.map((a) => (
            <div key={a.id} className={`cx-att ${a.kind}`} title={describeAttachment(a)}>
              {a.kind === "image" && a.data ? (
                <img src={a.data} alt="" />
              ) : (
                <span className={`cx-att-ic ${a.kind}`}><FileText size={16} /><em>{a.kind === "pdf" ? "PDF" : "TXT"}</em></span>
              )}
              <div>
                <b>{a.name}</b>
                <small>{a.kind === "image" ? "Image" : a.kind === "pdf" ? (a.pages ? `PDF · ${a.pages} page${a.pages === 1 ? "" : "s"}` : "PDF") : "Text"} · {formatSize(a.size)}</small>
              </div>
              <button onClick={() => setAttachments((l) => l.filter((x) => x.id !== a.id))} aria-label={`Remove ${a.name}`}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
      {liveGuard && liveGuard.total > 0 && (
        <div className="cx-guard" role="status">
          <ShieldCheck size={14} />
          <span>
            Privacy guard will hide {liveGuard.total === 1 ? "1 identifier" : `${liveGuard.total} identifiers`} before sending:{" "}
            {(Object.keys(liveGuard.hits) as IdentifierKind[]).map((k) => KIND_LABEL[k]).join(", ")}
          </span>
        </div>
      )}
      {atMenu && atList.length > 0 && (
        <div className="cx-at" role="listbox" aria-label="Ask a Crew assistant" data-at="menu">
          <p className="cx-at-h"><AtSign size={12} /> Ask a Crew assistant</p>
          {atList.map((c, i) => (
            <button key={c.id} type="button" role="option" aria-selected={i === atMenu.i} className={i === atMenu.i ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); pickMention(c); }} onMouseEnter={() => setAtMenu({ ...atMenu, i })}>
              <CrewBadge c={c} size={24} /><span><b>{c.name}</b><small>{c.tagline}</small></span>
            </button>
          ))}
        </div>
      )}
      {mention && (
        <div className={`cx-mention tone-${mention.tone}`} data-at="chip">
          <CrewBadge c={mention} size={20} /><span>Asking <b>{mention.name}</b> for this reply</span>
          <button type="button" onClick={() => setMention(null)} aria-label={`Stop asking ${mention.name}`}><X size={13} /></button>
        </div>
      )}
      <textarea
        ref={taRef}
        value={input}
        rows={1}
        placeholder={
          sim === "viva" ? "Type your answer…"
          : sim === "osce" ? "Ask the patient a question…"
          : view === "project" && project && mode === "general" ? `Start a new chat in ${project.name}…`
          : modeDef.placeholder
        }
        aria-label="Message Cadus"
        onChange={(e) => {
          const v = e.target.value;
          setInput(v);
          // "@" at the start of a word opens the Crew picker.
          const at = /(^|\s)@([\p{L}\p{N}-]{0,30})$/u.exec(v.slice(0, e.target.selectionStart ?? v.length));
          setAtMenu(at && !ROLEPLAY.has(mode) ? { q: at[2], i: 0 } : null);
        }}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files);
          if (!files.length) return;
          // Copying from Word or Excel also puts a picture of the selection on the clipboard: keep the text.
          if (e.clipboardData.getData("text/plain").trim() && files.every((f) => f.type.startsWith("image/"))) return;
          e.preventDefault();
          void onFiles(files);
        }}
        onKeyDown={(e) => {
          if (atMenu && atList.length) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setAtMenu({ ...atMenu, i: (atMenu.i + (e.key === "ArrowDown" ? 1 : atList.length - 1)) % atList.length }); return; }
            if ((e.key === "Enter" || e.key === "Tab") && !e.nativeEvent.isComposing) { e.preventDefault(); pickMention(atList[Math.min(atMenu.i, atList.length - 1)]); return; }
            if (e.key === "Escape") { e.preventDefault(); setAtMenu(null); return; }
          }
          if (e.key === "Backspace" && mention && !input && (e.currentTarget.selectionStart ?? 0) === 0) { setMention(null); return; }
          if (e.key === "Enter" && !e.shiftKey && prefs.enterToSend && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <div className="cx-cbar">
        <div className="cx-cbar-l">
          <button className={`cx-cbtn bordered cx-tip ${pop === "add" ? "open" : ""}`} data-pop="add" data-tip="Add files and more" onClick={() => toggleComposerMenu("add", placement)} aria-label="Add files and more"><Plus size={18} /></button>
          <button className={`cx-cbtn cx-tools-btn ${pop === "tools" ? "open" : ""}`} data-pop="tools" onClick={() => toggleComposerMenu("tools", placement)} aria-label="Tools" aria-haspopup="menu" aria-expanded={pop === "tools"}>
            <SlidersHorizontal size={16} /><span>Tools</span>
          </button>
          <button className="cx-cbtn cx-tip cx-at-btn" data-tip="Ask a Crew assistant (@)" aria-label="Ask a Crew assistant" onClick={() => { const v = input && !/\s$/.test(input) ? `${input} @` : `${input}@`; setInput(v); setAtMenu({ q: "", i: 0 }); focusComposer(); }}><AtSign size={16} /></button>
          <button
            className={`cx-cbtn cx-src cx-tip ${prefs.sources || mode === "research" ? "on" : ""}`}
            data-tip={mode === "research" ? "Deep research always searches sources" : prefs.sources ? "Sources on: cites WHO, NICE, ICMR, PubMed" : "Search trusted medical sources"}
            aria-label="Sources"
            aria-pressed={prefs.sources || mode === "research"}
            onClick={() => { if (!limits.sources) { setUpgrade({ reason: "Live sources with citations are part of Core and above.", feature: "sources" }); return; } if (mode !== "research") setPrefs((p) => ({ ...p, sources: !p.sources })); }}
          >
            <Globe size={16} /><span>Sources</span>
          </button>
          {!ROLEPLAY.has(mode) && mode !== "slides" && (() => {
            const cur = AMODE[prefs.answerMode] ?? AMODE.auto;
            return (
              <button
                className={`cx-cbtn cx-amode-btn ${prefs.answerMode !== "auto" ? "on" : ""} ${prefs.answerMode === "deep" ? "deep" : ""} ${pop === "amode" ? "open" : ""}`}
                data-pop="amode"
                onClick={() => toggleComposerMenu("amode", placement)}
                aria-haspopup="menu"
                aria-expanded={pop === "amode"}
                title={`Mode: ${cur.label}. ${cur.desc}`}
              >
                <cur.icon size={16} /><span>{cur.label}</span><ChevronDown size={13} className="cx-amode-chev" />
              </button>
            );
          })()}
          {mode !== "general" && (
            <span className="cx-mode-pill">
              <modeDef.icon size={14} />
              <span>{modeDef.label}</span>
              <button onClick={() => setMode("general")} aria-label="Clear tool"><X size={12} /></button>
            </span>
          )}
        </div>
        <div className="cx-cbar-r">
          {listening && <span className="cx-rec-l"><i /> Listening</span>}
          <button className={`cx-cbtn cx-tip ${listening ? "rec" : ""}`} data-tip={listening ? "Stop dictation" : "Dictate"} onClick={toggleVoice} aria-label="Dictate"><Mic size={18} /></button>
          {pending ? (
            <button className="cx-send cx-tip" data-tip="Stop" onClick={stop} aria-label="Stop response"><Square size={12} fill="currentColor" /></button>
          ) : !input.trim() && !attachments.length && canVoice ? (
            <button className="cx-send voice cx-tip" data-tip="Voice mode" onClick={() => void startVoice()} aria-label="Start voice mode"><AudioLines size={18} /></button>
          ) : (
            <button className="cx-send" onClick={() => send()} disabled={!input.trim() && !attachments.length} aria-label="Send"><ArrowUp size={18} /></button>
          )}
        </div>
      </div>
      {pop === "add" && (
        <div className={`cx-pop cx-add-menu ${placement === "hero" ? "down" : "up"}`} data-pop="add" role="menu" style={{ maxHeight: menuMax }}>
          <button className="cx-pop-i" onClick={() => { setPop(null); fileRef.current?.click(); }}><Paperclip size={16} /> Add photos and files <span className="r">Images, PDFs</span></button>
          <button className="cx-pop-i" onClick={() => { setPop(null); setCameraOpen(true); }}><Camera size={16} /> Take a photo</button>
          <div className="cx-pop-sep" />
          {!ROLEPLAY.has(mode) && mode !== "slides" && (
            <button className="cx-pop-i" onClick={() => { setThink((v) => !v); setPop(null); focusComposer(); }}>
              <Lightbulb size={16} /> Think deeper {think && <Check size={15} className="r" />}
            </button>
          )}
          {!ROLEPLAY.has(mode) && mode !== "slides" && (
            <button className="cx-pop-i" onClick={() => { setPrefs((p) => ({ ...p, answerMode: p.answerMode === "deep" ? "auto" : "deep" })); setPop(null); focusComposer(); }}>
              <Telescope size={16} /> Deep Dive <span className="r">{prefs.answerMode === "deep" ? <Check size={15} /> : "Cited report"}</span>
            </button>
          )}
          <button className="cx-pop-i" onClick={() => openCrew()}><Bot size={16} /> Cadus Crew <span className="r">Assistants</span></button>
          <button className="cx-pop-i" onClick={() => newDocument()}><FilePen size={16} /> New document <span className="r">Canvas</span></button>
          <div className="cx-pop-sep" />
          <p className="cx-pop-gl">Tip: drag files onto Cadus, or paste an image into the message box</p>
        </div>
      )}
      {pop === "amode" && (
        <div className={`cx-pop cx-amode-menu ${placement === "hero" ? "down" : "up"}`} data-pop="amode" role="menu" style={{ maxHeight: menuMax }}>
          <p className="cx-pop-gl">Mode</p>
          {ANSWER_MODES.map((am) => (
            <button
              key={am.id}
              role="menuitemradio"
              aria-checked={prefs.answerMode === am.id}
              className={`cx-amode-i ${prefs.answerMode === am.id ? "on" : ""} ${am.id === "deep" ? "deep" : ""}`}
              onClick={() => {
                if (am.id === "deep" && !limits.sources) { setPop(null); setUpgrade({ reason: "Deep Dive researches PubMed and live guideline sources, part of Core and above.", feature: "sources" }); return; }
                setPrefs((p) => ({ ...p, answerMode: am.id }));
                setPop(null);
                focusComposer();
              }}
            >
              <span className="ic"><am.icon size={16} /></span>
              <span className="tx"><b>{am.label}{am.id === "deep" && <em>New</em>}</b><small>{am.desc}</small></span>
              {prefs.answerMode === am.id && <Check size={15} className="ck" />}
            </button>
          ))}
          <div className="cx-pop-sep" />
          <div className="cx-amode-row" role="radiogroup" aria-label="Tone">
            <span>Tone</span>
            {TONES.map((t) => (
              <button key={t.id} role="radio" aria-checked={prefs.tone === t.id} className={prefs.tone === t.id ? "on" : ""} title={t.desc} onClick={() => setPrefs((p) => ({ ...p, tone: t.id }))}>{t.label}</button>
            ))}
          </div>
          <div className="cx-amode-row" role="radiogroup" aria-label="Length">
            <span>Length</span>
            {STYLES.map((st) => (
              <button key={st.id} role="radio" aria-checked={prefs.style === st.id} className={prefs.style === st.id ? "on" : ""} title={st.desc} onClick={() => setPrefs((p) => ({ ...p, style: st.id }))}>{st.id === "concise" ? "Short" : st.label}</button>
            ))}
          </div>
        </div>
      )}
      {pop === "tools" && (
        <div className={`cx-pop cx-tools-menu ${placement === "hero" ? "down" : "up"}`} data-pop="tools" role="menu" style={{ maxHeight: menuMax }}>
          <div className="cx-tools-grid">
            <p className="cx-pop-gl">Default</p>
            <button className={`cx-tool-i ${mode === "general" ? "on" : ""}`} onClick={() => pickMode("general")}>
              <span className="cx-tool-i-ic"><Sparkles size={15} /></span>
              <span><b>General</b><small>Any clinical or academic question</small></span>
            </button>
            <span />
            {GROUPS.map((g) => [
              <p key={`${g.label}-h`} className="cx-pop-gl">{g.label}</p>,
              ...g.ids.map((id) => {
                const m = MODE[id];
                return (
                  <button key={id} className={`cx-tool-i ${mode === id ? "on" : ""}`} onClick={() => pickMode(id)}>
                    <span className="cx-tool-i-ic"><m.icon size={15} /></span>
                    <span><b>{m.label}</b><small>{m.desc}</small></span>
                  </button>
                );
              }),
            ])}
          </div>
        </div>
      )}
    </div>
  );

  /** One-line labels for the home page's quick actions. */
  const QUICK_LABEL: Partial<Record<ModeId, string>> = {
    ddx: "Differentials", drugs: "Interactions", labs: "Lab results", slides: "Lecture slides", mcq: "Exam MCQs", viva: "Viva practice",
    osce: "OSCE station", handover: "Rounds (SBAR)", referral: "Referral letter", dosage: "Dosing", patient: "Patient info",
    research: "Research", discharge: "Discharge", procedure: "Procedures",
    admission: "Admission note", progress: "Progress note", opnote: "Op note", death: "Death summary", certificate: "Certificate", rx: "Prescription",
  };
  const quick = profile ? QUICK_BY_ROLE[profile.role] : QUICK;
  const recentChats = [...listed].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 7);
  const projectName = (id?: string) => (id ? projects.find((p) => p.id === id)?.name : undefined);

  /** A temporary chat starts from a plain page that says what it means. */
  const renderTempHome = () => (
    <section className="cx-home">
      <div className="cx-temp-home">
        <span className="cx-temp-ic"><MessageSquareDashed size={22} /></span>
        <h1>Temporary chat</h1>
        <p>This chat won't appear in your history, won't use or update memory, and is deleted when you leave it. Your custom instructions, the privacy guard and the safety review still apply.</p>
        {showHeroComposer && <div className="cx-hero-c">{composer("hero")}</div>}
        <button className="cx-btn" onClick={() => setTempNext(false)}>Turn off temporary chat</button>
      </div>
    </section>
  );

  /** Shortcuts for the user's specialty (calculators or tools), from their profile. */
  const specTools = specialtyTools(profile?.specialty).filter((t) => !t.calc || CALC_BY_ID[t.calc]);
  const runShortcut = (t: { calc?: string; mode?: string }) => (t.calc ? openCalculators({ calc: t.calc }) : t.mode ? startTool(t.mode as ModeId) : undefined);

  /** The home page: one question box, shortcuts for your role and specialty, and your recent work. */
  /** The workspaces, as tiles on the home and the Tools hub. */
  const openJobs = wardInfo.patients.reduce((n, p) => n + p.jobs.filter((j) => !j.done).length, 0);
  const WORKSPACES: { id: string; icon: LucideIcon; tone: string; title: string; sub: string; go: () => void }[] = [
    { id: "cases", icon: ClipboardList, tone: "teal", title: "Cases", sub: activeCases ? `${activeCases} active` : "Problems, timeline, handover", go: () => openCases() },
    { id: "learn", icon: GraduationCap, tone: "violet", title: "Learn", sub: ptot.attempted ? `${accuracy(ptot) ?? 0}% accuracy · ${streak(practice.days)}-day streak` : "Daily set, mocks, syllabus", go: openPractice },
    { id: "drugs", icon: Pill, tone: "rose", title: "Drugs", sub: "Database, doses, prescriber", go: () => openDrugs() },
    { id: "research", icon: Microscope, tone: "amber", title: "Research", sub: readingCount ? `${readingCount} paper${readingCount === 1 ? "" : "s"} to read` : "PubMed, citations, thesis", go: () => openResearch() },
    { id: "ward", icon: BedDouble, tone: "sky", title: "Ward round", sub: wardInfo.patients.length ? `${wardInfo.patients.length} patient${wardInfo.patients.length === 1 ? "" : "s"} · ${openJobs} job${openJobs === 1 ? "" : "s"}` : "Beds, jobs, handover", go: openWard },
    { id: "calculators", icon: Calculator, tone: "lime", title: "Calculators", sub: `${CALCULATORS.length} scores and formulas`, go: () => openCalculators() },
    { id: "scribe", icon: Mic, tone: "teal", title: "Scribe", sub: "Dictate a note, ICD-10, sign", go: () => openView("scribe") },
    { id: "emergency", icon: Siren, tone: "rose", title: "Emergencies", sub: "Timed protocols, crash-cart doses", go: () => openView("emergency") },
    { id: "paeds", icon: Baby, tone: "sky", title: "Paeds and obstetrics", sub: "Doses by weight, growth, EDD", go: () => openView("paeds") },
    { id: "leaflets", icon: FileText, tone: "amber", title: "Patient leaflets", sub: "In the patient's language", go: () => openView("leaflets") },
    { id: "simulator", icon: HeartPulse, tone: "violet", title: "Case Simulator", sub: "A live patient, then your score", go: () => openView("simulator") },
    { id: "rxcheck", icon: ShieldPlus, tone: "rose", title: "Rx Safety Check", sub: "Check a prescription in seconds", go: () => openView("rxcheck") },
    { id: "watch", icon: BellRing, tone: "sky", title: "Guideline Watch", sub: "What's new in your specialty", go: () => openView("watch") },
    { id: "explain", icon: FileScan, tone: "lime", title: "Report Explainer", sub: "For you and for the patient", go: () => openView("explain") },
    { id: "translate", icon: Languages, tone: "teal", title: "Consult Translator", sub: "Talk in the patient's language", go: () => openView("translate") },
    { id: "pathways", icon: GitFork, tone: "amber", title: "Clinical Pathways", sub: "Step by step to a decision", go: () => openView("pathways") },
    { id: "flashcards", icon: Layers, tone: "violet", title: "Flashcards", sub: "Spaced repetition, Anki export", go: () => openView("flashcards") },
    { id: "compare", icon: History, tone: "sky", title: "Compare over time", sub: "What changed between studies", go: () => openView("compare") },
    { id: "medrec", icon: Pill, tone: "rose", title: "Med Reconciliation", sub: "Before and after, a patient sheet", go: () => openView("medrec") },
    { id: "present", icon: Presentation, tone: "violet", title: "Presentation Coach", sub: "Present a case, get scored", go: () => openView("present") },
    { id: "discharge", icon: FileOutput, tone: "sky", title: "Discharge Summary", sub: "From notes, with patient advice", go: () => openView("discharge") },
    { id: "handover", icon: ArrowRightLeft, tone: "amber", title: "Shift Handover", sub: "I-PASS from your ward list", go: () => openView("handover") },
    { id: "ddx", icon: Waypoints, tone: "rose", title: "Differential Builder", sub: "Ranked, with can't-miss flags", go: () => openView("ddx") },
    { id: "studyplan", icon: CalendarCheck, tone: "violet", title: "Study Planner", sub: "Day by day to your exam", go: () => openView("studyplan") },
    { id: "podcasts", icon: Headphones, tone: "violet", title: "Revision Podcasts", sub: "Two voices, on the go", go: () => openView("podcasts") },
    { id: "ecg", icon: Activity, tone: "rose", title: "ECG Reader", sub: "Photo in, systematic read out", go: () => openView("ecg") },
    { id: "abx", icon: Bug, tone: "sky", title: "Antibiotic Guide", sub: "Empiric, adjusted to the patient", go: () => openView("abx") },
    { id: "procedure", icon: ListChecks, tone: "amber", title: "Procedure Guide", sub: "Steps, checklist and consent", go: () => openView("procedure") },
    { id: "poison", icon: FlaskRound, tone: "rose", title: "Poisoning & Snakebite", sub: "Antidotes and doses", go: () => openView("poison") },
    { id: "infusions", icon: Syringe, tone: "sky", title: "Infusions", sub: "Dose to mL/h and back", go: () => openView("infusions") },
    { id: "convert", icon: Scale, tone: "violet", title: "Dose Converter", sub: "Steroids and opioids", go: () => openView("convert") },
    { id: "abg", icon: Wind, tone: "sky", title: "ABG Interpreter", sub: "Step by step", go: () => openView("abg") },
    { id: "logbook", icon: BookCheck, tone: "amber", title: "PG Logbook", sub: "Procedures, cases, duties", go: () => openView("logbook") },
    { id: "followups", icon: CalendarClock, tone: "violet", title: "Follow-ups", sub: "Who to review and when", go: () => openView("followups") },
    { id: "voiceviva", icon: MicVocal, tone: "violet", title: "Voice Viva", sub: "Asked aloud, answered aloud", go: () => void startVoice("viva") },
    { id: "voiceosce", icon: Speech, tone: "teal", title: "Voice OSCE", sub: "Talk to the patient, get scored", go: () => void startVoice("osce") },
    { id: "audiolib", icon: FileAudio, tone: "amber", title: "Patient Audio Library", sub: "Spoken explainers, 13 languages", go: () => openView("audiolib") },
    { id: "rxwrite", icon: FilePen, tone: "sky", title: "Prescription Writer", sub: "From diagnosis to signed Rx", go: () => openView("rxwrite") },
    { id: "labtrend", icon: ChartLine, tone: "teal", title: "Lab Trends", sub: "Report photos to charts", go: () => openView("labtrend") },
    { id: "daily", icon: CalendarHeart, tone: "violet", title: "Daily Clinical Case", sub: "Five questions, keep your streak", go: () => openView("daily") },
    { id: "letters", icon: ScrollText, tone: "amber", title: "Letters & Certificates", sub: "Referral, fitness, leave, pre-auth", go: () => openView("letters") },
    { id: "adr", icon: ShieldAlert, tone: "rose", title: "ADR Report (PvPI)", sub: "Fill the PvPI form from notes", go: () => openView("adr") },
    { id: "mccd", icon: FileSignature, tone: "sky", title: "Cause of Death (MCCD)", sub: "The causal sequence, done right", go: () => openView("mccd") },
    { id: "mnemonics", icon: Brain, tone: "violet", title: "Mnemonic Maker", sub: "Classic or new, with a story", go: () => openView("mnemonics") },
    { id: "generics", icon: PillBottle, tone: "lime", title: "Generic Finder", sub: "Brand to generic and NLEM", go: () => openView("generics") },
    { id: "opd", icon: ListOrdered, tone: "teal", title: "OPD Queue", sub: "Tokens, vitals, token board", go: () => openView("opd") },
    { id: "imagequiz", icon: Images, tone: "violet", title: "Clinical Image Quiz", sub: "Your images as a quiz", go: () => openView("imagequiz") },
    { id: "dosecard", icon: Weight, tone: "rose", title: "Dose Card by Weight", sub: "Emergency doses for a weight", go: () => openView("dosecard") },
    { id: "mocks", icon: Timer, tone: "amber", title: "Mock Tests", sub: "Timed, subject-wise, +4/−1", go: () => openPractice("mock") },
    { id: "oncall", icon: PhoneCall, tone: "rose", title: "On-call Helper", sub: "The ward is calling: what now", go: () => openView("oncall") },
    { id: "journal", icon: BookOpenText, tone: "sky", title: "Journal Club", sub: "Appraise a paper, CASP", go: () => openView("journal") },
    { id: "stats", icon: Sigma, tone: "lime", title: "Statistics Test Chooser", sub: "Which test for your thesis", go: () => openView("stats") },
    { id: "roster", icon: CalendarRange, tone: "amber", title: "Duty Roster", sub: "A fair on-call roster", go: () => openView("roster") },
    { id: "records", icon: FolderHeart, tone: "teal", title: "Patient Records", sub: "Every visit, on this device", go: () => openView("records") },
    { id: "voiceround", icon: AudioWaveform, tone: "sky", title: "Ward Rounds by Voice", sub: "Dictate at each bed", go: () => openView("voiceround") },
    { id: "revnotes", icon: NotebookPen, tone: "violet", title: "Revision Notes", sub: "High-yield, revised on time", go: () => openView("revnotes") },
    { id: "analytics", icon: BarChart3, tone: "lime", title: "Clinic Analytics", sub: "Patients, waits, top complaints", go: () => openView("analytics") },
    { id: "preop", icon: ClipboardPlus, tone: "rose", title: "Pre-op Assessment", sub: "ASA, RCRI, meds before surgery", go: () => openView("preop") },
    { id: "messages", icon: MessageSquareText, tone: "teal", title: "Patient Messages", sub: "Reminders in their language", go: () => openView("messages") },
    { id: "preglact", icon: Baby, tone: "rose", title: "Pregnancy & Breastfeeding", sub: "Is this medicine safe now?", go: () => openView("preglact") },
    { id: "pillchart", icon: Sun, tone: "amber", title: "Pill Chart", sub: "Sun and moon, for any patient", go: () => openView("pillchart") },
    { id: "vaccines", icon: Syringe, tone: "teal", title: "Vaccination Scheduler", sub: "UIP or IAP, due and overdue", go: () => openView("vaccines") },
    { id: "diet", icon: Salad, tone: "lime", title: "Diet Chart Maker", sub: "Indian diet in their language", go: () => openView("diet") },
    { id: "icd", icon: FileCode2, tone: "sky", title: "ICD-10 Coder", sub: "Codes for records and claims", go: () => openView("icd") },
    { id: "consent", icon: FileSignature, tone: "violet", title: "Consent Form Writer", sub: "Bilingual, procedure-specific", go: () => openView("consent") },
    { id: "insulin", icon: Pipette, tone: "amber", title: "Insulin Planner", sub: "Starting doses and titration", go: () => openView("insulin") },
    { id: "transfusion", icon: Droplet, tone: "rose", title: "Blood Transfusion", sub: "Dose, rate, reactions", go: () => openView("transfusion") },
    { id: "mlc", icon: Gavel, tone: "rose", title: "MLC Injury Report", sub: "Injuries worded for court", go: () => openView("mlc") },
    { id: "tb", icon: Microscope, tone: "teal", title: "TB Treatment (NTEP)", sub: "Tablets by weight band", go: () => openView("tb") },
    { id: "antenatal", icon: Heart, tone: "rose", title: "Antenatal Care Tracker", sub: "Visits, risks and the EDD", go: () => openView("antenatal") },
    { id: "ventilator", icon: Fan, tone: "sky", title: "Ventilator Helper", sub: "ARDSnet settings and ABG", go: () => openView("ventilator") },
    { id: "teleconsult", icon: Video, tone: "teal", title: "Teleconsultation Note", sub: "Record and e-prescription", go: () => openView("teleconsult") },
    { id: "bills", icon: ReceiptIndianRupee, tone: "amber", title: "Clinic Bills & Receipts", sub: "Receipts and the day's takings", go: () => openView("bills") },
    { id: "bite", icon: Dog, tone: "rose", title: "Animal Bite (Rabies PEP)", sub: "Category, vaccine dates, RIG", go: () => openView("bite") },
    { id: "needlestick", icon: Bandage, tone: "violet", title: "Needle-stick Injury", sub: "HIV PEP, hepatitis B and C", go: () => openView("needlestick") },
    { id: "imnci", icon: Thermometer, tone: "lime", title: "IMNCI Sick Child", sub: "Pink, yellow or green", go: () => openView("imnci") },
    { id: "cme", icon: Award, tone: "sky", title: "CME Credits", sub: "Hours towards renewal", go: () => openView("cme") },
    { id: "appointments", icon: CalendarPlus, tone: "teal", title: "Appointments", sub: "Slots, reminders, arrivals", go: () => openView("appointments") },
    { id: "stock", icon: Warehouse, tone: "amber", title: "Pharmacy Stock & Expiry", sub: "Low stock and expiry alerts", go: () => openView("stock") },
    { id: "screening", icon: HeartHandshake, tone: "violet", title: "Mental Health Screening", sub: "PHQ-9, GAD-7, AUDIT-C", go: () => openView("screening") },
    { id: "kidney", icon: Bean, tone: "sky", title: "Kidney Dose Adjuster", sub: "Doses for CrCl or dialysis", go: () => openView("kidney") },
    { id: "sam", icon: Ruler, tone: "lime", title: "Malnutrition (SAM) Helper", sub: "MUAC, NRC, F-75 volumes", go: () => openView("sam") },
    { id: "contacts", icon: ContactRound, tone: "teal", title: "Referral Contacts", sub: "Call or WhatsApp in one tap", go: () => openView("contacts") },
    { id: "accounts", icon: Wallet, tone: "amber", title: "Clinic Accounts", sub: "Income, expenses, net", go: () => openView("accounts") },
    { id: "thyroid", icon: Gauge, tone: "rose", title: "Thyroid Dose Helper", sub: "Levothyroxine by TSH", go: () => openView("thyroid") },
    { id: "backup", icon: DatabaseBackup, tone: "sky", title: "Backup & Restore", sub: "Everything on this device, locked", go: () => openView("backup") },
    { id: "ncd", icon: TrendingUp, tone: "rose", title: "BP & Sugar Protocols", sub: "Step up BP and diabetes", go: () => openView("ncd") },
    { id: "anaemia", icon: Droplets, tone: "rose", title: "Anaemia & Iron", sub: "Grade, oral and IV iron", go: () => openView("anaemia") },
    { id: "dengue", icon: BugOff, tone: "lime", title: "Dengue Helper", sub: "Group A, B, C and fluids", go: () => openView("dengue") },
    { id: "electrolytes", icon: FlaskConical, tone: "sky", title: "Electrolyte Replacement", sub: "K, Na, Mg, Ca", go: () => openView("electrolytes") },
    { id: "obsemergency", icon: Ambulance, tone: "rose", title: "Obstetric Emergencies", sub: "Eclampsia, PPH, dystocia", go: () => openView("obsemergency") },
    { id: "infection", icon: Biohazard, tone: "amber", title: "Infection Control & Waste", sub: "Which bin, which isolation", go: () => openView("infection") },
    { id: "asthma", icon: Wind, tone: "sky", title: "Asthma & COPD Plans", sub: "GINA, GOLD, action plan", go: () => openView("asthma") },
    { id: "milestones", icon: PersonStanding, tone: "lime", title: "Developmental Milestones", sub: "By age, with red flags", go: () => openView("milestones") },
    { id: "contraception", icon: Ribbon, tone: "violet", title: "Contraception Advisor", sub: "WHO MEC, national basket", go: () => openView("contraception") },
    { id: "palliative", icon: HandHeart, tone: "rose", title: "Palliative Care Helper", sub: "Morphine and end of life", go: () => openView("palliative") },
    { id: "imaging", icon: ScanLine, tone: "amber", title: "Imaging Decision Rules", sub: "Ottawa and Canadian rules", go: () => openView("imaging") },
    { id: "ivfluids", icon: Droplet, tone: "sky", title: "IV Fluids Planner", sub: "Bolus and maintenance", go: () => openView("ivfluids") },
    { id: "sickday", icon: ThermometerSun, tone: "amber", title: "Sick-Day Rules", sub: "Which medicines to pause", go: () => openView("sickday") },
    { id: "labranges", icon: TestTubes, tone: "teal", title: "Lab Reference Ranges", sub: "Typical adult ranges", go: () => openView("labranges") },
    { id: "burns", icon: Flame, tone: "rose", title: "Burns Helper", sub: "TBSA, Parkland, referral", go: () => openView("burns") },
    { id: "jaundice", icon: Lightbulb, tone: "amber", title: "Neonatal Jaundice", sub: "Phototherapy thresholds", go: () => openView("jaundice") },
    { id: "stroke", icon: Brain, tone: "violet", title: "Stroke & Thrombolysis", sub: "Clock, NIHSS, dose", go: () => openView("stroke") },
    { id: "bundles", icon: HeartPulse, tone: "rose", title: "Sepsis & DKA Bundles", sub: "Hour-1 bundle, DKA protocol", go: () => openView("bundles") },
    { id: "alcohol", icon: Wine, tone: "violet", title: "Alcohol Withdrawal", sub: "CIWA-Ar and thiamine", go: () => openView("alcohol") },
    { id: "dfoot", icon: Footprints, tone: "teal", title: "Diabetic Foot", sub: "Infection grade, risk, care", go: () => openView("dfoot") },
    { id: "heat", icon: Sun, tone: "amber", title: "Heat Illness", sub: "Heat stroke, heat index", go: () => openView("heat") },
    { id: "wound", icon: Bandage, tone: "sky", title: "Wound & Suture Care", sub: "Sutures, tetanus, LA dose", go: () => openView("wound") },
    { id: "anticoag", icon: Syringe, tone: "rose", title: "Warfarin & Anticoagulation", sub: "INR changes, DOAC doses", go: () => openView("anticoag") },
    { id: "fevers", icon: Bug, tone: "amber", title: "Tropical Fevers", sub: "Malaria, typhoid, scrub, lepto", go: () => openView("fevers") },
    { id: "elderly", icon: Accessibility, tone: "teal", title: "Elderly Care", sub: "Frailty, 4AT, falls, medicines", go: () => openView("elderly") },
    { id: "quitsmoking", icon: CigaretteOff, tone: "violet", title: "Quit Smoking Helper", sub: "Fagerström, NRT, quit plan", go: () => openView("quitsmoking") },
    { id: "croup", icon: AirVent, tone: "sky", title: "Croup & Child Asthma", sub: "Westley score, doses", go: () => openView("croup") },
    { id: "rheumatic", icon: HeartCrack, tone: "rose", title: "Rheumatic Fever", sub: "Jones criteria, prophylaxis", go: () => openView("rheumatic") },
    { id: "weight", icon: Scale, tone: "lime", title: "Weight Management", sub: "Asian BMI, calorie target", go: () => openView("weight") },
    { id: "hypo", icon: Candy, tone: "amber", title: "Hypoglycaemia", sub: "Adult, child, newborn", go: () => openView("hypo") },
    { id: "gdm", icon: Droplets, tone: "rose", title: "Gestational Diabetes", sub: "DIPSI, targets, insulin", go: () => openView("gdm") },
    { id: "infantfeed", icon: Milk, tone: "sky", title: "Infant Feeding", sub: "Volumes, weight loss, weaning", go: () => openView("infantfeed") },
    { id: "antidep", icon: Repeat, tone: "violet", title: "Antidepressant Switcher", sub: "Switch, cross-taper, stop", go: () => openView("antidep") },
    { id: "eyeent", icon: Eye, tone: "teal", title: "Eye & ENT Triage", sub: "Red eye, nosebleed, ear, throat", go: () => openView("eyeent") },
    { id: "vte", icon: ShieldPlus, tone: "amber", title: "VTE Prophylaxis", sub: "Padua, enoxaparin dose", go: () => openView("vte") },
    { id: "headache", icon: BrainCircuit, tone: "violet", title: "Headache & Migraine", sub: "Red flags, prevention", go: () => openView("headache") },
    { id: "skin", icon: Hand, tone: "lime", title: "Skin Infections", sub: "Scabies, tinea, cellulitis", go: () => openView("skin") },
    { id: "gout", icon: Bone, tone: "amber", title: "Gout & Uric Acid", sub: "Flare, allopurinol titration", go: () => openView("gout") },
    { id: "pnuti", icon: Pill, tone: "rose", title: "Pneumonia & UTI Antibiotics", sub: "CURB-65, UTI by type", go: () => openView("pnuti") },
    { id: "ckd", icon: Bean, tone: "teal", title: "CKD Care", sub: "KDIGO stage, SGLT2i, referral", go: () => openView("ckd") },
    { id: "preterm", icon: Hourglass, tone: "rose", title: "Preterm Labour", sub: "Steroids, magnesium, tocolysis", go: () => openView("preterm") },
    { id: "epilepsy", icon: Zap, tone: "violet", title: "Epilepsy & First Seizure", sub: "Work-up, drug choice, safety", go: () => openView("epilepsy") },
    { id: "childfever", icon: Thermometer, tone: "amber", title: "Fever in Under-5s", sub: "NICE traffic light", go: () => openView("childfever") },
    { id: "cirrhosis", icon: FlaskRound, tone: "lime", title: "Cirrhosis & Ascites", sub: "Child-Pugh, MELD-Na, SBP", go: () => openView("cirrhosis") },
    { id: "dementia", icon: BrainCog, tone: "violet", title: "Dementia & Memory", sub: "Mini-Cog, causes, medicines", go: () => openView("dementia") },
    { id: "htnemergency", icon: Gauge, tone: "rose", title: "Hypertensive Emergency", sub: "Targets and IV drugs", go: () => openView("htnemergency") },
    { id: "ugib", icon: Activity, tone: "rose", title: "Upper GI Bleed & H. pylori", sub: "Blatchford, endoscopy, eradication", go: () => openView("ugib") },
    { id: "aki", icon: FlaskConical, tone: "sky", title: "Acute Kidney Injury", sub: "KDIGO stage, causes, dialysis", go: () => openView("aki") },
    { id: "hepbc", icon: ShieldCheck, tone: "amber", title: "Hepatitis B & C", sub: "Serology, who to treat, cure", go: () => openView("hepbc") },
    { id: "nrp", icon: Baby, tone: "rose", title: "Newborn Resuscitation", sub: "Timer, steps, doses", go: () => openView("nrp") },
    { id: "pain", icon: PillBottle, tone: "violet", title: "Pain Relief Planner", sub: "Stepwise, by comorbidity", go: () => openView("pain") },
    { id: "bone", icon: Bone, tone: "lime", title: "Osteoporosis & Bone Health", sub: "T-score, who to treat, drugs", go: () => openView("bone") },
    { id: "hrt", icon: Flower2, tone: "violet", title: "Menopause & HRT", sub: "Regimen, risks, alternatives", go: () => openView("hrt") },
    { id: "syncope", icon: HeartPulse, tone: "amber", title: "Syncope", sub: "ESC risk, admit or discharge", go: () => openView("syncope") },
    { id: "hf", icon: HeartPulse, tone: "rose", title: "Heart Failure GDMT", sub: "Four pillars, titration", go: () => openView("hf") },
    { id: "af", icon: Activity, tone: "violet", title: "Atrial Fibrillation", sub: "CHA2DS2-VA, rate, rhythm", go: () => openView("af") },
    { id: "lipids", icon: Droplets, tone: "amber", title: "Lipids & CV Risk", sub: "LAI targets, statin plan", go: () => openView("lipids") },
    { id: "pedvt", icon: Waves, tone: "sky", title: "PE & DVT", sub: "Wells, D-dimer, sPESI, treatment", go: () => openView("pedvt") },
    { id: "hiv", icon: Ribbon, tone: "rose", title: "HIV Care", sub: "Start ART, prophylaxis, VL", go: () => openView("hiv") },
    { id: "preeclampsia", icon: Baby, tone: "rose", title: "Pre-eclampsia", sub: "Aspirin, diagnosis, plan", go: () => openView("preeclampsia") },
    { id: "sleep", icon: Moon, tone: "violet", title: "Insomnia & Sleep", sub: "STOP-BANG, CBT-I, handout", go: () => openView("sleep") },
    { id: "urticaria", icon: CircleDot, tone: "lime", title: "Urticaria & Angioedema", sub: "Antihistamine steps, UAS7", go: () => openView("urticaria") },
    { id: "anaphylaxis", icon: Siren, tone: "rose", title: "Anaphylaxis & Allergy Plan", sub: "Adrenaline, refractory, plan", go: () => openView("anaphylaxis") },
    { id: "trauma", icon: Ambulance, tone: "rose", title: "Trauma Primary Survey", sub: "<C>ABCDE clock, MTP, TXA", go: () => openView("trauma") },
    { id: "tox", icon: FlaskConical, tone: "amber", title: "Toxicology", sub: "Paracetamol, organophosphate", go: () => openView("tox") },
    { id: "ptx", icon: Wind, tone: "sky", title: "Pneumothorax & Chest Drain", sub: "BTS pathway, drain steps", go: () => openView("ptx") },
    { id: "fluids", icon: TestTube, tone: "teal", title: "Body Fluid Analysis", sub: "Pleural, ascitic, CSF, joint", go: () => openView("fluids") },
    { id: "steroid", icon: Syringe, tone: "violet", title: "Adrenal Crisis & Steroid Cover", sub: "Equivalents, surgery cover", go: () => openView("steroid") },
    { id: "refeed", icon: Utensils, tone: "lime", title: "Refeeding & Nutrition", sub: "NICE risk, calorie ramp", go: () => openView("refeed") },
    { id: "backpain", icon: Bone, tone: "amber", title: "Back Pain & Cauda Equina", sub: "Red flags, urgency", go: () => openView("backpain") },
    { id: "acs", icon: HeartPulse, tone: "rose", title: "Chest Pain & ACS", sub: "HEART score, STEMI, lysis", go: () => openView("acs") },
    { id: "childfluids", icon: GlassWater, tone: "sky", title: "Child Fluids & Dehydration", sub: "WHO plans A, B, C, maintenance", go: () => openView("childfluids") },
    { id: "agitation", icon: ShieldAlert, tone: "amber", title: "Agitation & Rapid Tranquillisation", sub: "De-escalation, oral and IM", go: () => openView("agitation") },
    { id: "suicide", icon: LifeBuoy, tone: "violet", title: "Suicide Risk & Safety Plan", sub: "Columbia screen, safety plan", go: () => openView("suicide") },
    { id: "headinjury", icon: Brain, tone: "navy", title: "Head Injury & CT Rules", sub: "NICE adult, PECARN child", go: () => openView("headinjury") },
    { id: "abdomen", icon: Stethoscope, tone: "teal", title: "Acute Abdomen & Appendicitis", sub: "Alvarado, PAS, BISAP", go: () => openView("abdomen") },
    { id: "fneutro", icon: ShieldPlus, tone: "lime", title: "Febrile Neutropenia", sub: "ANC, MASCC, first-hour antibiotics", go: () => openView("fneutro") },
    { id: "meningitis", icon: Bug, tone: "rose", title: "Meningitis & Encephalitis", sub: "CT before LP, antibiotics by age", go: () => openView("meningitis") },
    { id: "statusepi", icon: Zap, tone: "rose", title: "Status Epilepticus", sub: "Timed pathway, doses by weight", go: () => openView("statusepi") },
    { id: "sodium", icon: FlaskConical, tone: "sky", title: "Hyponatraemia & Sodium", sub: "Cause, fluids, safe correction", go: () => openView("sodium") },
    { id: "attack", icon: Wind, tone: "teal", title: "Asthma & COPD Attack", sub: "Severity, nebs, magnesium, NIV", go: () => openView("attack") },
    { id: "bridging", icon: ClipboardCheck, tone: "violet", title: "Pre-op Risk & Anticoagulant Bridging", sub: "RCRI, DOACs, warfarin, stents", go: () => openView("bridging") },
    { id: "oncoemerg", icon: Ribbon, tone: "amber", title: "Oncology Emergencies", sub: "Calcium, TLS, cord compression", go: () => openView("oncoemerg") },
    { id: "spirometry", icon: Gauge, tone: "lime", title: "Spirometry Interpreter", sub: "Ratio, pattern, GOLD, reversibility", go: () => openView("spirometry") },
    { id: "thyroidstorm", icon: Thermometer, tone: "navy", title: "Thyroid Storm & Myxoedema Coma", sub: "Burch-Wartofsky, ICU regimens", go: () => openView("thyroidstorm") },
    { id: "sickle", icon: Droplets, tone: "rose", title: "Sickle Cell & Thalassaemia", sub: "Crisis, hydroxyurea, chelation", go: () => openView("sickle") },
    { id: "hyperk", icon: HeartPulse, tone: "rose", title: "Hyperkalaemia & ECG", sub: "Protect, shift, remove", go: () => openView("hyperk") },
    { id: "pancreatitis", icon: Stethoscope, tone: "amber", title: "Acute Pancreatitis Plan", sub: "Atlanta, Ranson, fluids, feeding", go: () => openView("pancreatitis") },
    { id: "paedsepsis", icon: Baby, tone: "rose", title: "Paediatric Sepsis & Shock", sub: "Phoenix score, first hour", go: () => openView("paedsepsis") },
    { id: "airway", icon: Wind, tone: "navy", title: "Upper Airway & Stridor", sub: "Causes, choking, tracheostomy", go: () => openView("airway") },
    { id: "rhabdo", icon: Bone, tone: "amber", title: "Rhabdomyolysis & CK", sub: "McMahon score, fluids", go: () => openView("rhabdo") },
    { id: "hypothermia", icon: Snowflake, tone: "sky", title: "Hypothermia & Drowning", sub: "Staging, rewarming, cold arrest", go: () => openView("hypothermia") },
    { id: "paeddka", icon: Droplet, tone: "violet", title: "Paediatric DKA", sub: "BSPED fluids, insulin, oedema", go: () => openView("paeddka") },
    { id: "retention", icon: Droplets, tone: "teal", title: "Acute Urinary Retention", sub: "Catheter, residual, TWOC", go: () => openView("retention") },
    { id: "preghtn", icon: Baby, tone: "rose", title: "Hypertension in Pregnancy & Postpartum", sub: "Severe BP, MgSO4, postpartum", go: () => openView("preghtn") },
    { id: "stones", icon: Droplets, tone: "sky", title: "Kidney Stones & Colic", sub: "Decompress, MET, size plan", go: () => openView("stones") },
    { id: "paedabx", icon: Baby, tone: "lime", title: "Children's Antibiotics by Weight", sub: "Otitis, pneumonia, UTI, typhoid", go: () => openView("paedabx") },
    { id: "opioid", icon: Syringe, tone: "violet", title: "Opioid Conversion & Palliative Infusions", sub: "OME, patches, syringe driver", go: () => openView("opioid") },
    { id: "cellulitis", icon: Bandage, tone: "amber", title: "Cellulitis & Necrotising Fasciitis", sub: "LRINEC, red flags, antibiotics", go: () => openView("cellulitis") },
    { id: "kawasaki", icon: Baby, tone: "rose", title: "Kawasaki Disease", sub: "AHA criteria, IVIG, aspirin", go: () => openView("kawasaki") },
    { id: "endocarditis", icon: HeartPulse, tone: "navy", title: "Infective Endocarditis", sub: "Duke criteria, empirical antibiotics", go: () => openView("endocarditis") },
    { id: "bell", icon: Smile, tone: "teal", title: "Bell's Palsy & Facial Weakness", sub: "Red flags, steroids, eye care", go: () => openView("bell") },
    { id: "pph", icon: Droplet, tone: "rose", title: "Postpartum Haemorrhage", sub: "Shock index, 4 Ts, uterotonics", go: () => openView("pph") },
    { id: "neosepsis", icon: Baby, tone: "violet", title: "Neonatal Sepsis & Antibiotics", sub: "Risk framework, gentamicin by GA", go: () => openView("neosepsis") },
    { id: "renalabx", icon: FlaskConical, tone: "sky", title: "Antibiotic Renal Dosing", sub: "CrCl, dialysis, loading doses", go: () => openView("renalabx") },
    { id: "braindeath", icon: HeartHandshake, tone: "slate", title: "Brain-stem Death & Organ Donation", sub: "Apnoea test, THOTA, donor care", go: () => openView("braindeath") },
    { id: "septicjoint", icon: Bone, tone: "amber", title: "Septic Arthritis & Hot Joint", sub: "Kocher, aspirate, antibiotics", go: () => openView("septicjoint") },
    { id: "neohypo", icon: Baby, tone: "lime", title: "Neonatal Hypoglycaemia", sub: "Gel, IV dextrose, GIR", go: () => openView("neohypo") },
    { id: "altitude", icon: Mountain, tone: "sky", title: "Altitude Illness", sub: "Lake Louise, AMS, HACE, HAPE", go: () => openView("altitude") },
    { id: "serotonin", icon: Thermometer, tone: "rose", title: "Serotonin Syndrome vs NMS", sub: "Hunter criteria, treatment", go: () => openView("serotonin") },
    { id: "paedasthma", icon: Baby, tone: "sky", title: "Acute Asthma in Children", sub: "PRAM score, salbutamol, steroids", go: () => openView("paedasthma") },
    { id: "dkahhs", icon: Droplet, tone: "rose", title: "DKA & HHS Adult Timer", sub: "Fluids, insulin, potassium, checks", go: () => openView("dkahhs") },
    { id: "ansteroid", icon: Baby, tone: "violet", title: "Antenatal Steroids & Tocolysis", sub: "Betamethasone, nifedipine, MgSO4", go: () => openView("ansteroid") },
    { id: "ironb12", icon: Pill, tone: "amber", title: "Iron, B12 & Folate Replacement", sub: "Ganzoni, IV iron, B12, folate", go: () => openView("ironb12") },
    { id: "tdm", icon: FlaskConical, tone: "teal", title: "Therapeutic Drug Levels", sub: "Ranges, timing, toxicity", go: () => openView("tdm") },
    { id: "contrast", icon: ScanLine, tone: "sky", title: "Contrast Safety", sub: "Kidneys, metformin, allergy", go: () => openView("contrast") },
    { id: "pressure", icon: Bed, tone: "amber", title: "Pressure Injuries", sub: "Braden score, stages, care", go: () => openView("pressure") },
    { id: "hyperemesis", icon: Baby, tone: "lime", title: "Hyperemesis Gravidarum", sub: "PUQE, antiemetics, fluids", go: () => openView("hyperemesis") },
  ];
  const backupNeeded = view !== "backup" && backupDue();
  /** The More drawer: every tool, grouped by what it is for (update 24). */
  type MoreItem = { label: string; title: string; icon: LucideIcon; on: boolean; go: () => void; tour?: string; badge?: ReactNode };
  const moreGroups: { id: string; label: string; icon: LucideIcon; items: MoreItem[] }[] = [
    { id: "clinic", label: "Clinic & OPD", icon: Stethoscope, items: [
        { label: "Today", title: "Today", icon: CalendarDays, on: view === "today", go: () => openView("today") },
        { label: "OPD Queue", title: "OPD Queue", icon: ListOrdered, on: view === "opd", go: () => openView("opd") },
        { label: "Patient Records", title: "Patient Records", icon: FolderHeart, on: view === "records", go: () => openView("records") },
        { label: "Prescription Writer", title: "Prescription Writer", icon: FilePen, on: view === "rxwrite", go: () => openView("rxwrite") },
        { label: "Teleconsultation Note", title: "Teleconsultation Note", icon: Video, on: view === "teleconsult", go: () => openView("teleconsult") },
        { label: "Follow-ups", title: "Follow-ups", icon: CalendarClock, on: view === "followups", go: () => openView("followups") },
        { label: "Patient Messages", title: "Patient Messages", icon: MessageSquareText, on: view === "messages", go: () => openView("messages") },
        { label: "Leaflets", title: "Patient leaflets and consent", icon: FileText, on: view === "leaflets", go: () => openView("leaflets") },
        { label: "Patient Audio Library", title: "Patient Audio Library", icon: FileAudio, on: view === "audiolib", go: () => openView("audiolib") },
        { label: "Pill Chart", title: "Pill Chart", icon: Sun, on: view === "pillchart", go: () => openView("pillchart") },
        { label: "Diet Chart Maker", title: "Diet Chart Maker", icon: Salad, on: view === "diet", go: () => openView("diet") },
        { label: "Consult Translator", title: "Consult Translator", icon: Languages, on: view === "translate", go: () => openView("translate") },
        { label: "BP & Sugar Protocols", title: "BP & Sugar Protocols", icon: TrendingUp, on: view === "ncd", go: () => openView("ncd") },
        { label: "Sick-Day Rules", title: "Sick-Day Rules", icon: ThermometerSun, on: view === "sickday", go: () => openView("sickday") },
        { label: "Diabetic Foot", title: "Diabetic Foot", icon: Footprints, on: view === "dfoot", go: () => openView("dfoot") },
        { label: "Wound & Suture Care", title: "Wound & Suture Care", icon: Bandage, on: view === "wound", go: () => openView("wound") },
        { label: "Tropical Fevers", title: "Tropical Fevers", icon: Bug, on: view === "fevers", go: () => openView("fevers") },
        { label: "Quit Smoking Helper", title: "Quit Smoking Helper", icon: CigaretteOff, on: view === "quitsmoking", go: () => openView("quitsmoking") },
        { label: "Weight Management", title: "Weight Management", icon: Scale, on: view === "weight", go: () => openView("weight") },
        { label: "Eye & ENT Triage", title: "Eye & ENT Triage", icon: Eye, on: view === "eyeent", go: () => openView("eyeent") },
        { label: "Skin Infections", title: "Skin Infections", icon: Hand, on: view === "skin", go: () => openView("skin") },
        { label: "CKD Care", title: "CKD Care", icon: Bean, on: view === "ckd", go: () => openView("ckd") },
        { label: "Hepatitis B & C", title: "Hepatitis B & C", icon: ShieldCheck, on: view === "hepbc", go: () => openView("hepbc") },
        { label: "Osteoporosis & Bone Health", title: "Osteoporosis & Bone Health", icon: Bone, on: view === "bone", go: () => openView("bone") },
        { label: "Menopause & HRT", title: "Menopause & HRT", icon: Flower2, on: view === "hrt", go: () => openView("hrt") },
        { label: "HIV Care", title: "HIV Care", icon: Ribbon, on: view === "hiv", go: () => openView("hiv") },
        { label: "Insomnia & Sleep", title: "Insomnia & Sleep", icon: Moon, on: view === "sleep", go: () => openView("sleep") },
        { label: "Back Pain & Cauda Equina", title: "Back Pain & Cauda Equina", icon: Bone, on: view === "backpain", go: () => openView("backpain") },
        { label: "Suicide Risk & Safety Plan", title: "Suicide Risk & Safety Plan", icon: LifeBuoy, on: view === "suicide", go: () => openView("suicide") },
        { label: "Sickle Cell & Thalassaemia", title: "Sickle Cell & Thalassaemia", icon: Droplets, on: view === "sickle", go: () => openView("sickle") },
        { label: "Cellulitis & Necrotising Fasciitis", title: "Cellulitis & Necrotising Fasciitis", icon: Bandage, on: view === "cellulitis", go: () => openView("cellulitis") },
        { label: "Bell's Palsy & Facial Weakness", title: "Bell's Palsy & Facial Weakness", icon: Smile, on: view === "bell", go: () => openView("bell") },
        { label: "Septic Arthritis & Hot Joint", title: "Septic Arthritis & Hot Joint", icon: Bone, on: view === "septicjoint", go: () => openView("septicjoint") },
        { label: "Iron, B12 & Folate Replacement", title: "Iron, B12 & Folate Replacement", icon: Pill, on: view === "ironb12", go: () => openView("ironb12") },
      ] },
    { id: "practice", label: "Practice", icon: BriefcaseMedical, items: [
        { label: "Appointments", title: "Appointments", icon: CalendarPlus, on: view === "appointments", go: () => openView("appointments") },
        { label: "Clinic Bills & Receipts", title: "Clinic Bills & Receipts", icon: ReceiptIndianRupee, on: view === "bills", go: () => openView("bills") },
        { label: "Clinic Accounts", title: "Clinic Accounts", icon: Wallet, on: view === "accounts", go: () => openView("accounts") },
        { label: "Pharmacy Stock & Expiry", title: "Pharmacy Stock & Expiry", icon: Warehouse, on: view === "stock", go: () => openView("stock") },
        { label: "Clinic Analytics", title: "Clinic Analytics", icon: BarChart3, on: view === "analytics", go: () => openView("analytics") },
        { label: "Referral Contacts", title: "Referral Contacts", icon: ContactRound, on: view === "contacts", go: () => openView("contacts") },
        { label: "Duty Roster", title: "Duty Roster", icon: CalendarRange, on: view === "roster", go: () => openView("roster") },
        { label: "CME Credits", title: "CME Credits", icon: Award, on: view === "cme", go: () => openView("cme") },
        { label: "Infection Control & Waste", title: "Infection Control & Waste", icon: Biohazard, on: view === "infection", go: () => openView("infection") },
      ] },
    { id: "ward", label: "Ward & On-call", icon: BedDouble, items: [
        { label: "Ward round", title: "Ward round", icon: BedDouble, on: view === "ward", go: openWard, tour: "ward", badge: wardInfo.patients.length > 0 && <em>{wardInfo.patients.length}</em> },
        { label: "Ward Rounds by Voice", title: "Ward Rounds by Voice", icon: AudioWaveform, on: view === "voiceround", go: () => openView("voiceround") },
        { label: "Shift Handover", title: "Shift Handover", icon: ArrowRightLeft, on: view === "handover", go: () => openView("handover") },
        { label: "Discharge Summary", title: "Discharge Summary", icon: FileOutput, on: view === "discharge", go: () => openView("discharge") },
        { label: "On-call Helper", title: "On-call Helper", icon: PhoneCall, on: view === "oncall", go: () => openView("oncall") },
        { label: "Pre-op Assessment", title: "Pre-op Assessment", icon: ClipboardPlus, on: view === "preop", go: () => openView("preop") },
        { label: "Procedure Guide", title: "Procedure Guide", icon: ListChecks, on: view === "procedure", go: () => openView("procedure") },
        { label: "Electrolyte Replacement", title: "Electrolyte Replacement", icon: FlaskConical, on: view === "electrolytes", go: () => openView("electrolytes") },
        { label: "IV Fluids Planner", title: "IV Fluids Planner", icon: Droplet, on: view === "ivfluids", go: () => openView("ivfluids") },
        { label: "Alcohol Withdrawal", title: "Alcohol Withdrawal", icon: Wine, on: view === "alcohol", go: () => openView("alcohol") },
        { label: "Elderly Care", title: "Elderly Care", icon: Accessibility, on: view === "elderly", go: () => openView("elderly") },
        { label: "VTE Prophylaxis", title: "VTE Prophylaxis", icon: ShieldPlus, on: view === "vte", go: () => openView("vte") },
        { label: "Cirrhosis & Ascites", title: "Cirrhosis & Ascites", icon: FlaskRound, on: view === "cirrhosis", go: () => openView("cirrhosis") },
        { label: "Acute Kidney Injury", title: "Acute Kidney Injury", icon: FlaskConical, on: view === "aki", go: () => openView("aki") },
        { label: "Heart Failure GDMT", title: "Heart Failure GDMT", icon: HeartPulse, on: view === "hf", go: () => openView("hf") },
        { label: "Pneumothorax & Chest Drain", title: "Pneumothorax & Chest Drain", icon: Wind, on: view === "ptx", go: () => openView("ptx") },
        { label: "Adrenal Crisis & Steroid Cover", title: "Adrenal Crisis & Steroid Cover", icon: Syringe, on: view === "steroid", go: () => openView("steroid") },
        { label: "Refeeding & Nutrition", title: "Refeeding & Nutrition", icon: Utensils, on: view === "refeed", go: () => openView("refeed") },
        { label: "Agitation & Rapid Tranquillisation", title: "Agitation & Rapid Tranquillisation", icon: ShieldAlert, on: view === "agitation", go: () => openView("agitation") },
        { label: "Febrile Neutropenia", title: "Febrile Neutropenia", icon: ShieldPlus, on: view === "fneutro", go: () => openView("fneutro") },
        { label: "Hyponatraemia & Sodium", title: "Hyponatraemia & Sodium", icon: FlaskConical, on: view === "sodium", go: () => openView("sodium") },
        { label: "Pre-op Risk & Anticoagulant Bridging", title: "Pre-op Risk & Anticoagulant Bridging", icon: ClipboardCheck, on: view === "bridging", go: () => openView("bridging") },
        { label: "Oncology Emergencies", title: "Oncology Emergencies", icon: Ribbon, on: view === "oncoemerg", go: () => openView("oncoemerg") },
        { label: "Acute Pancreatitis Plan", title: "Acute Pancreatitis Plan", icon: Stethoscope, on: view === "pancreatitis", go: () => openView("pancreatitis") },
        { label: "Rhabdomyolysis & CK", title: "Rhabdomyolysis & CK", icon: Bone, on: view === "rhabdo", go: () => openView("rhabdo") },
        { label: "Acute Urinary Retention", title: "Acute Urinary Retention", icon: Droplets, on: view === "retention", go: () => openView("retention") },
        { label: "Kidney Stones & Colic", title: "Kidney Stones & Colic", icon: Droplets, on: view === "stones", go: () => openView("stones") },
        { label: "Infective Endocarditis", title: "Infective Endocarditis", icon: HeartPulse, on: view === "endocarditis", go: () => openView("endocarditis") },
        { label: "Pressure Injuries", title: "Pressure Injuries", icon: Bed, on: view === "pressure", go: () => openView("pressure") },
      ] },
    { id: "emergency", label: "Emergency & ICU", icon: Siren, items: [
        { label: "Emergencies", title: "Emergency protocols", icon: Siren, on: view === "emergency", go: () => openView("emergency") },
        { label: "Dose Card by Weight", title: "Dose Card by Weight", icon: Weight, on: view === "dosecard", go: () => openView("dosecard") },
        { label: "Infusions", title: "Infusions", icon: Syringe, on: view === "infusions", go: () => openView("infusions") },
        { label: "Ventilator Helper", title: "Ventilator Helper", icon: Fan, on: view === "ventilator", go: () => openView("ventilator") },
        { label: "ABG Interpreter", title: "ABG Interpreter", icon: Wind, on: view === "abg", go: () => openView("abg") },
        { label: "ECG Reader", title: "ECG Reader", icon: Activity, on: view === "ecg", go: () => openView("ecg") },
        { label: "Blood Transfusion", title: "Blood Transfusion", icon: Droplet, on: view === "transfusion", go: () => openView("transfusion") },
        { label: "Insulin Planner", title: "Insulin Planner", icon: Pipette, on: view === "insulin", go: () => openView("insulin") },
        { label: "Poisoning & Snakebite", title: "Poisoning & Snakebite", icon: FlaskRound, on: view === "poison", go: () => openView("poison") },
        { label: "Animal Bite (Rabies PEP)", title: "Animal Bite (Rabies PEP)", icon: Dog, on: view === "bite", go: () => openView("bite") },
        { label: "Needle-stick Injury", title: "Needle-stick Injury", icon: Bandage, on: view === "needlestick", go: () => openView("needlestick") },
        { label: "Dengue Helper", title: "Dengue Helper", icon: BugOff, on: view === "dengue", go: () => openView("dengue") },
        { label: "Imaging Decision Rules", title: "Imaging Decision Rules", icon: ScanLine, on: view === "imaging", go: () => openView("imaging") },
        { label: "Burns Helper", title: "Burns Helper", icon: Flame, on: view === "burns", go: () => openView("burns") },
        { label: "Stroke & Thrombolysis", title: "Stroke & Thrombolysis", icon: Brain, on: view === "stroke", go: () => openView("stroke") },
        { label: "Sepsis & DKA Bundles", title: "Sepsis & DKA Bundles", icon: HeartPulse, on: view === "bundles", go: () => openView("bundles") },
        { label: "Heat Illness", title: "Heat Illness", icon: Sun, on: view === "heat", go: () => openView("heat") },
        { label: "Hypoglycaemia", title: "Hypoglycaemia", icon: Candy, on: view === "hypo", go: () => openView("hypo") },
        { label: "Hypertensive Emergency", title: "Hypertensive Emergency", icon: Gauge, on: view === "htnemergency", go: () => openView("htnemergency") },
        { label: "Upper GI Bleed & H. pylori", title: "Upper GI Bleed & H. pylori", icon: Activity, on: view === "ugib", go: () => openView("ugib") },
        { label: "Syncope", title: "Syncope", icon: HeartPulse, on: view === "syncope", go: () => openView("syncope") },
        { label: "Atrial Fibrillation", title: "Atrial Fibrillation", icon: Activity, on: view === "af", go: () => openView("af") },
        { label: "PE & DVT", title: "PE & DVT", icon: Waves, on: view === "pedvt", go: () => openView("pedvt") },
        { label: "Anaphylaxis & Allergy Plan", title: "Anaphylaxis & Allergy Plan", icon: Siren, on: view === "anaphylaxis", go: () => openView("anaphylaxis") },
        { label: "Trauma Primary Survey", title: "Trauma Primary Survey", icon: Ambulance, on: view === "trauma", go: () => openView("trauma") },
        { label: "Toxicology", title: "Toxicology", icon: FlaskConical, on: view === "tox", go: () => openView("tox") },
        { label: "Chest Pain & ACS", title: "Chest Pain & ACS", icon: HeartPulse, on: view === "acs", go: () => openView("acs") },
        { label: "Head Injury & CT Rules", title: "Head Injury & CT Rules", icon: Brain, on: view === "headinjury", go: () => openView("headinjury") },
        { label: "Meningitis & Encephalitis", title: "Meningitis & Encephalitis", icon: Bug, on: view === "meningitis", go: () => openView("meningitis") },
        { label: "Status Epilepticus", title: "Status Epilepticus", icon: Zap, on: view === "statusepi", go: () => openView("statusepi") },
        { label: "Asthma & COPD Attack", title: "Asthma & COPD Attack", icon: Wind, on: view === "attack", go: () => openView("attack") },
        { label: "Thyroid Storm & Myxoedema Coma", title: "Thyroid Storm & Myxoedema Coma", icon: Thermometer, on: view === "thyroidstorm", go: () => openView("thyroidstorm") },
        { label: "Hyperkalaemia & ECG", title: "Hyperkalaemia & ECG", icon: HeartPulse, on: view === "hyperk", go: () => openView("hyperk") },
        { label: "Upper Airway & Stridor", title: "Upper Airway & Stridor", icon: Wind, on: view === "airway", go: () => openView("airway") },
        { label: "Hypothermia & Drowning", title: "Hypothermia & Drowning", icon: Snowflake, on: view === "hypothermia", go: () => openView("hypothermia") },
        { label: "Brain-stem Death & Organ Donation", title: "Brain-stem Death & Organ Donation", icon: HeartHandshake, on: view === "braindeath", go: () => openView("braindeath") },
        { label: "Altitude Illness", title: "Altitude Illness", icon: Mountain, on: view === "altitude", go: () => openView("altitude") },
        { label: "Serotonin Syndrome vs NMS", title: "Serotonin Syndrome vs NMS", icon: Thermometer, on: view === "serotonin", go: () => openView("serotonin") },
        { label: "DKA & HHS Adult Timer", title: "DKA & HHS Adult Timer", icon: Droplet, on: view === "dkahhs", go: () => openView("dkahhs") },
      ] },
    { id: "drugs", label: "Drugs & Prescribing", icon: Pill, items: [
        { label: "Drugs", title: "Drugs and prescriber", icon: Pill, on: view === "drugs", go: () => openDrugs() },
        { label: "Rx Safety Check", title: "Rx Safety Check", icon: ShieldPlus, on: view === "rxcheck", go: () => openView("rxcheck") },
        { label: "Med Reconciliation", title: "Med Reconciliation", icon: Pill, on: view === "medrec", go: () => openView("medrec") },
        { label: "Generic Finder", title: "Generic Finder", icon: PillBottle, on: view === "generics", go: () => openView("generics") },
        { label: "Antibiotic Guide", title: "Antibiotic Guide", icon: Bug, on: view === "abx", go: () => openView("abx") },
        { label: "Dose Converter", title: "Dose Converter", icon: Scale, on: view === "convert", go: () => openView("convert") },
        { label: "TB Treatment (NTEP)", title: "TB Treatment (NTEP)", icon: Microscope, on: view === "tb", go: () => openView("tb") },
        { label: "Kidney Dose Adjuster", title: "Kidney Dose Adjuster", icon: Bean, on: view === "kidney", go: () => openView("kidney") },
        { label: "Thyroid Dose Helper", title: "Thyroid Dose Helper", icon: Gauge, on: view === "thyroid", go: () => openView("thyroid") },
        { label: "Anaemia & Iron", title: "Anaemia & Iron", icon: Droplets, on: view === "anaemia", go: () => openView("anaemia") },
        { label: "Asthma & COPD Plans", title: "Asthma & COPD Plans", icon: Wind, on: view === "asthma", go: () => openView("asthma") },
        { label: "Palliative Care Helper", title: "Palliative Care Helper", icon: HandHeart, on: view === "palliative", go: () => openView("palliative") },
        { label: "Warfarin & Anticoagulation", title: "Warfarin & Anticoagulation", icon: Syringe, on: view === "anticoag", go: () => openView("anticoag") },
        { label: "Antidepressant Switcher", title: "Antidepressant Switcher", icon: Repeat, on: view === "antidep", go: () => openView("antidep") },
        { label: "Gout & Uric Acid", title: "Gout & Uric Acid", icon: Bone, on: view === "gout", go: () => openView("gout") },
        { label: "Pneumonia & UTI Antibiotics", title: "Pneumonia & UTI Antibiotics", icon: Pill, on: view === "pnuti", go: () => openView("pnuti") },
        { label: "Pain Relief Planner", title: "Pain Relief Planner", icon: PillBottle, on: view === "pain", go: () => openView("pain") },
        { label: "Lipids & CV Risk", title: "Lipids & CV Risk", icon: Droplets, on: view === "lipids", go: () => openView("lipids") },
        { label: "Urticaria & Angioedema", title: "Urticaria & Angioedema", icon: CircleDot, on: view === "urticaria", go: () => openView("urticaria") },
        { label: "Opioid Conversion & Palliative Infusions", title: "Opioid Conversion & Palliative Infusions", icon: Syringe, on: view === "opioid", go: () => openView("opioid") },
        { label: "Antibiotic Renal Dosing", title: "Antibiotic Renal Dosing", icon: FlaskConical, on: view === "renalabx", go: () => openView("renalabx") },
        { label: "Therapeutic Drug Levels", title: "Therapeutic Drug Levels", icon: FlaskConical, on: view === "tdm", go: () => openView("tdm") },
      ] },
    { id: "mother", label: "Mother & Child", icon: Baby, items: [
        { label: "Paeds and obstetrics", title: "Paediatrics and obstetrics", icon: Baby, on: view === "paeds", go: () => openView("paeds") },
        { label: "Antenatal Care Tracker", title: "Antenatal Care Tracker", icon: Heart, on: view === "antenatal", go: () => openView("antenatal") },
        { label: "Pregnancy & Breastfeeding", title: "Pregnancy & Breastfeeding", icon: Baby, on: view === "preglact", go: () => openView("preglact") },
        { label: "Vaccination Scheduler", title: "Vaccination Scheduler", icon: Syringe, on: view === "vaccines", go: () => openView("vaccines") },
        { label: "IMNCI Sick Child", title: "IMNCI Sick Child", icon: Thermometer, on: view === "imnci", go: () => openView("imnci") },
        { label: "Malnutrition (SAM) Helper", title: "Malnutrition (SAM) Helper", icon: Ruler, on: view === "sam", go: () => openView("sam") },
        { label: "Obstetric Emergencies", title: "Obstetric Emergencies", icon: Ambulance, on: view === "obsemergency", go: () => openView("obsemergency") },
        { label: "Developmental Milestones", title: "Developmental Milestones", icon: PersonStanding, on: view === "milestones", go: () => openView("milestones") },
        { label: "Contraception Advisor", title: "Contraception Advisor", icon: Ribbon, on: view === "contraception", go: () => openView("contraception") },
        { label: "Neonatal Jaundice", title: "Neonatal Jaundice", icon: Lightbulb, on: view === "jaundice", go: () => openView("jaundice") },
        { label: "Croup & Child Asthma", title: "Croup & Child Asthma", icon: AirVent, on: view === "croup", go: () => openView("croup") },
        { label: "Gestational Diabetes", title: "Gestational Diabetes", icon: Droplets, on: view === "gdm", go: () => openView("gdm") },
        { label: "Infant Feeding", title: "Infant Feeding", icon: Milk, on: view === "infantfeed", go: () => openView("infantfeed") },
        { label: "Preterm Labour", title: "Preterm Labour", icon: Hourglass, on: view === "preterm", go: () => openView("preterm") },
        { label: "Fever in Under-5s", title: "Fever in Under-5s", icon: Thermometer, on: view === "childfever", go: () => openView("childfever") },
        { label: "Newborn Resuscitation", title: "Newborn Resuscitation", icon: Baby, on: view === "nrp", go: () => openView("nrp") },
        { label: "Pre-eclampsia", title: "Pre-eclampsia", icon: Baby, on: view === "preeclampsia", go: () => openView("preeclampsia") },
        { label: "Child Fluids & Dehydration", title: "Child Fluids & Dehydration", icon: GlassWater, on: view === "childfluids", go: () => openView("childfluids") },
        { label: "Paediatric Sepsis & Shock", title: "Paediatric Sepsis & Shock", icon: Baby, on: view === "paedsepsis", go: () => openView("paedsepsis") },
        { label: "Paediatric DKA", title: "Paediatric DKA", icon: Droplet, on: view === "paeddka", go: () => openView("paeddka") },
        { label: "Hypertension in Pregnancy & Postpartum", title: "Hypertension in Pregnancy & Postpartum", icon: Baby, on: view === "preghtn", go: () => openView("preghtn") },
        { label: "Children's Antibiotics by Weight", title: "Children's Antibiotics by Weight", icon: Baby, on: view === "paedabx", go: () => openView("paedabx") },
        { label: "Kawasaki Disease", title: "Kawasaki Disease", icon: Baby, on: view === "kawasaki", go: () => openView("kawasaki") },
        { label: "Postpartum Haemorrhage", title: "Postpartum Haemorrhage", icon: Droplet, on: view === "pph", go: () => openView("pph") },
        { label: "Neonatal Sepsis & Antibiotics", title: "Neonatal Sepsis & Antibiotics", icon: Baby, on: view === "neosepsis", go: () => openView("neosepsis") },
        { label: "Neonatal Hypoglycaemia", title: "Neonatal Hypoglycaemia", icon: Baby, on: view === "neohypo", go: () => openView("neohypo") },
        { label: "Acute Asthma in Children", title: "Acute Asthma in Children", icon: Baby, on: view === "paedasthma", go: () => openView("paedasthma") },
        { label: "Antenatal Steroids & Tocolysis", title: "Antenatal Steroids & Tocolysis", icon: Baby, on: view === "ansteroid", go: () => openView("ansteroid") },
        { label: "Hyperemesis Gravidarum", title: "Hyperemesis Gravidarum", icon: Baby, on: view === "hyperemesis", go: () => openView("hyperemesis") },
      ] },
    { id: "diagnosis", label: "Diagnosis & Evidence", icon: Microscope, items: [
        { label: "Research", title: "Research", icon: Microscope, on: view === "research", go: () => openResearch(), tour: "research" },
        { label: "Differential Builder", title: "Differential Builder", icon: Waypoints, on: view === "ddx", go: () => openView("ddx") },
        { label: "Report Explainer", title: "Report Explainer", icon: FileScan, on: view === "explain", go: () => openView("explain") },
        { label: "Lab Trends", title: "Lab Trends", icon: ChartLine, on: view === "labtrend", go: () => openView("labtrend") },
        { label: "Compare over time", title: "Compare over time", icon: History, on: view === "compare", go: () => openView("compare") },
        { label: "Clinical Pathways", title: "Clinical Pathways", icon: GitFork, on: view === "pathways", go: () => openView("pathways") },
        { label: "Guideline Watch", title: "Guideline Watch", icon: BellRing, on: view === "watch", go: () => openView("watch") },
        { label: "Calculators", title: "Calculators", icon: Calculator, on: view === "calculators", go: () => openCalculators(), tour: "calculators" },
        { label: "Journal Club", title: "Journal Club", icon: BookOpenText, on: view === "journal", go: () => openView("journal") },
        { label: "Statistics Test Chooser", title: "Statistics Test Chooser", icon: Sigma, on: view === "stats", go: () => openView("stats") },
        { label: "Mental Health Screening", title: "Mental Health Screening", icon: HeartHandshake, on: view === "screening", go: () => openView("screening") },
        { label: "Lab Reference Ranges", title: "Lab Reference Ranges", icon: TestTubes, on: view === "labranges", go: () => openView("labranges") },
        { label: "Rheumatic Fever", title: "Rheumatic Fever", icon: HeartCrack, on: view === "rheumatic", go: () => openView("rheumatic") },
        { label: "Headache & Migraine", title: "Headache & Migraine", icon: BrainCircuit, on: view === "headache", go: () => openView("headache") },
        { label: "Epilepsy & First Seizure", title: "Epilepsy & First Seizure", icon: Zap, on: view === "epilepsy", go: () => openView("epilepsy") },
        { label: "Dementia & Memory", title: "Dementia & Memory", icon: BrainCog, on: view === "dementia", go: () => openView("dementia") },
        { label: "Body Fluid Analysis", title: "Body Fluid Analysis", icon: TestTube, on: view === "fluids", go: () => openView("fluids") },
        { label: "Acute Abdomen & Appendicitis", title: "Acute Abdomen & Appendicitis", icon: Stethoscope, on: view === "abdomen", go: () => openView("abdomen") },
        { label: "Spirometry Interpreter", title: "Spirometry Interpreter", icon: Gauge, on: view === "spirometry", go: () => openView("spirometry") },
        { label: "Contrast Safety", title: "Contrast Safety", icon: ScanLine, on: view === "contrast", go: () => openView("contrast") },
      ] },
    { id: "documents", label: "Documents & Legal", icon: ScrollText, items: [
        { label: "Scribe", title: "Scribe: dictated notes", icon: Mic, on: view === "scribe", go: () => openView("scribe") },
        { label: "Letters & Certificates", title: "Letters & Certificates", icon: ScrollText, on: view === "letters", go: () => openView("letters") },
        { label: "Consent Form Writer", title: "Consent Form Writer", icon: FileSignature, on: view === "consent", go: () => openView("consent") },
        { label: "MLC Injury Report", title: "MLC Injury Report", icon: Gavel, on: view === "mlc", go: () => openView("mlc") },
        { label: "Cause of Death (MCCD)", title: "Cause of Death (MCCD)", icon: FileSignature, on: view === "mccd", go: () => openView("mccd") },
        { label: "ADR Report (PvPI)", title: "ADR Report (PvPI)", icon: ShieldAlert, on: view === "adr", go: () => openView("adr") },
        { label: "ICD-10 Coder", title: "ICD-10 Coder", icon: FileCode2, on: view === "icd", go: () => openView("icd") },
      ] },
    { id: "learn", label: "Learn & Exams", icon: GraduationCap, items: [
        { label: "Daily Clinical Case", title: "Daily Clinical Case", icon: CalendarHeart, on: view === "daily", go: () => openView("daily") },
        { label: "Mock Tests", title: "Mock Tests", icon: Timer, on: false, go: () => openPractice("mock") },
        { label: "Revision Notes", title: "Revision Notes", icon: NotebookPen, on: view === "revnotes", go: () => openView("revnotes") },
        { label: "Flashcards", title: "Flashcards", icon: Layers, on: view === "flashcards", go: () => openView("flashcards") },
        { label: "Clinical Image Quiz", title: "Clinical Image Quiz", icon: Images, on: view === "imagequiz", go: () => openView("imagequiz") },
        { label: "Case Simulator", title: "Case Simulator", icon: HeartPulse, on: view === "simulator", go: () => openView("simulator") },
        { label: "Voice Viva", title: "Voice Viva", icon: MicVocal, on: false, go: () => void startVoice("viva") },
        { label: "Voice OSCE", title: "Voice OSCE", icon: Speech, on: false, go: () => void startVoice("osce") },
        { label: "Presentation Coach", title: "Presentation Coach", icon: Presentation, on: view === "present", go: () => openView("present") },
        { label: "Revision Podcasts", title: "Revision Podcasts", icon: Headphones, on: view === "podcasts", go: () => openView("podcasts") },
        { label: "Mnemonic Maker", title: "Mnemonic Maker", icon: Brain, on: view === "mnemonics", go: () => openView("mnemonics") },
        { label: "Study Planner", title: "Study Planner", icon: CalendarCheck, on: view === "studyplan", go: () => openView("studyplan") },
        { label: "PG Logbook", title: "PG Logbook", icon: BookCheck, on: view === "logbook", go: () => openView("logbook") },
      ] },
    { id: "work", label: "My work", icon: Folder, items: [
        { label: "Projects", title: "Projects", icon: Folder, on: view === "projects" || view === "project", go: openProjects, badge: projects.length > 0 && <em>{projects.length}</em> },
        { label: "Decks", title: "Decks", icon: Presentation, on: view === "decks", go: () => { setView("decks"); setSidebarOpen(false); }, badge: decks.length > 0 && <em>{decks.length}</em> },
        { label: "Backup & Restore", title: "Backup & Restore", icon: DatabaseBackup, on: view === "backup", go: () => openView("backup"), badge: backupNeeded ? <em className="cx-bk-due" title="Back up your data">!</em> : undefined },
      ] },
  ];
  const moreItemButton = (i: MoreItem) => (
    <button key={i.label} data-tour={i.tour} className={`cx-nav-i ${i.on ? "on" : ""}`} onClick={() => { setMoreQ(""); i.go(); }} title={i.title}><i.icon size={16} /><span className="cx-nav-l">{i.label}</span>{i.badge}</button>
  );
  const moreFound = moreQ.trim() ? moreGroups.flatMap((g) => g.items).filter((i) => `${i.label} ${i.title}`.toLowerCase().includes(moreQ.trim().toLowerCase())) : [];
  const activeGroup = moreGroups.find((g) => g.items.some((i) => i.on))?.id ?? "";
  // Opening a tool from anywhere (a tile, search, the desktop menu) opens its group in the sidebar.
  useEffect(() => { if (activeGroup) setOpenGroups([activeGroup]); }, [activeGroup]);
  const workspaceTiles = (compact = false) => (
    <div className={`cx-ws-grid ${compact ? "compact" : ""}`}>
      {WORKSPACES.map((w, i) => (
        <button key={w.id} className={`cx-ws-tile tone-${w.tone}`} style={{ ["--i" as string]: i }} onClick={w.go} data-ws={w.id}>
          <span className="cx-ws-ic"><w.icon size={compact ? 18 : 20} strokeWidth={1.9} /></span>
          <span className="cx-ws-t"><b>{w.title}</b><small>{w.sub}</small></span>
          <ArrowRight size={14} className="cx-ws-go" />
        </button>
      ))}
    </div>
  );

  /** A new chat with a Crew assistant starts from its own page: who it is and its first questions. */
  const homeCrew = view === "chat" && !activeId ? findCrew(crewNext, crewMine) : undefined;
  const renderCrewHome = (c: CrewMember) => (
    <section className="cx-home cx-crew-home">
      <div className="cx-crew-hero">
        <CrewBadge c={c} size={64} />
        <h1>{c.name}</h1>
        {c.tagline && <p>{c.tagline}</p>}
        {c.greeting && <p className="cx-crew-greet" data-crew="greeting">{c.greeting}</p>}
        <span className="cx-crew-by">{c.builtIn ? "Cadus Crew · by Cadus" : "Cadus Crew · yours"}{c.mode !== "general" ? ` · ${MODE[c.mode as ModeId]?.label}` : ""}</span>
        <button className={`cx-chip cx-crew-mentor ${crewStyles[c.id]?.mentor ? "on" : ""}`} aria-pressed={!!crewStyles[c.id]?.mentor} onClick={() => { const on = !crewStyles[c.id]?.mentor; setCrewStyles((mm) => setStyle(mm, c.id, { ...mm[c.id], mentor: on })); toast(on ? "Mentor mode on: it will ask before it tells" : "Mentor mode off"); }} data-crew="mentor-home"><GraduationCap size={13} /> Mentor mode {crewStyles[c.id]?.mentor ? "on" : "off"}</button>
        {showHeroComposer && <div className="cx-hero-c">{composer("hero")}</div>}
        {c.starters.length > 0 && (
          <div className="cx-crew-starters">
            {c.starters.map((st, i) => (
              <button key={st} style={{ ["--i" as string]: i }} onClick={() => { if (/^(paste|attach)\b/i.test(st)) { setInput(""); focusComposer(); toast(st); return; } void send(st); }}>{st}<ArrowUpRight size={14} /></button>
            ))}
          </div>
        )}
        <div className="cx-crew-home-f">
          {!c.builtIn && <button className="cx-link" onClick={() => setCrewEdit({ ...c })}><Pencil size={13} /> Edit</button>}
          <button className="cx-link" onClick={() => { setCrewNext(""); focusComposer(); }}><X size={13} /> Leave {c.name}</button>
          <button className="cx-link" onClick={openCrew}><Bot size={13} /> All assistants</button>
        </div>
      </div>
    </section>
  );

  const renderHome = () => tempNext ? renderTempHome() : homeCrew ? renderCrewHome(homeCrew) : (
    <section className="cx-home cx-fh cx-fh-premium">
      <div className="cx-fh-wash" aria-hidden="true"><i /><i /><i /></div>
      <div className="cx-fh-in">
        <header className="cx-fh-h">
          <h1>{greeting()}{firstName ? `, ${firstName}` : ""}</h1>
          <p>
            {profile ? (
              <>
                <span>{profileSummary(profile)}</span>
                {examDays !== null && <span> · <b>{examDays} {examDays === 1 ? "day" : "days"}</b> to {practiceExam(profile)}</span>}
                {badge && <span className="cx-fh-badge" title={`${badge} (self-declared)`}><ShieldCheck size={13} /> Registered practitioner</span>}
                <button className="cx-dash-edit" onClick={() => setProfileOpen(true)}>Edit profile</button>
              </>
            ) : (
              <>
                <span>Clinical answers checked by a second model, with sources.</span>
                <button className="cx-dash-edit" onClick={() => setProfileOpen(true)}><UserCog size={13} /> Personalise Cadus</button>
              </>
            )}
          </p>
        </header>
        {showHeroComposer && <div className="cx-hero-c">{composer("hero")}</div>}
        <div className="cx-quick cx-fh-chips">
          {quick.slice(0, specTools.length ? 1 : 2).map((id) => {
            const m = MODE[id];
            return <button key={id} className="cx-q" onClick={() => startTool(id)} title={m.desc}><m.icon size={15} /> {QUICK_LABEL[id] ?? m.short}</button>;
          })}
          {specTools.slice(0, 2).map((t) => (
            <button key={t.label} className="cx-q spec" onClick={() => runShortcut(t)} title={profile?.specialty ? `For ${profile.specialty}` : undefined}>
              {t.calc ? <Calculator size={15} /> : <Stethoscope size={15} />} {t.label}
            </button>
          ))}
          {!specTools.length && <button className="cx-q" onClick={() => openCalculators()} title="Bedside scores and formulas"><Calculator size={15} /> Calculators</button>}
          <button className="cx-q more" onClick={() => setView("tools")}><LayoutGrid size={15} /> All tools</button>
        </div>

        <div className="cx-fh-recent">
          <div className="cx-fh-sh">
            <span>{recentChats.length ? "Recent" : "Try a sample case"}</span>
            {listed.length > 0 && <button onClick={openPalette}><Search size={13} /> Search chats <kbd>{MOD} K</kbd></button>}
          </div>
          <div className="cx-fh-list">
            {recentChats.length ? recentChats.slice(0, 4).map((s) => {
              const m = MODE[sessionMode(s)];
              const proj = projectName(s.projectId);
              return (
                <button key={s.id} className="cx-fh-row" onClick={() => openSession(s.id)}>
                  <span className="cx-li-ic"><m.icon size={14} /></span>
                  <span className="cx-fh-row-t"><b>{s.title}</b><small>{m.label}{proj ? ` · ${proj}` : ""}</small></span>
                  <span className="cx-li-m">{relTime(s.updatedAt)}</span>
                </button>
              );
            }) : EXAMPLES.slice(0, 3).map((ex) => {
              const m = MODE[ex.mode];
              return (
                <button key={ex.text} className="cx-fh-row" onClick={() => send(ex.text, ex.mode)}>
                  <span className="cx-li-ic"><m.icon size={14} /></span>
                  <span className="cx-fh-row-t"><b>{ex.text}</b><small>{m.label}</small></span>
                  <ArrowRight size={14} className="cx-li-go" />
                </button>
              );
            })}
          </div>
          {(wardInfo.patients.length > 0 || activeCases > 0 || readingCount > 0 || ptot.attempted > 0 || decks.length > 0 || library.length > 0) && (
            <div className="cx-fh-status">
              {wardInfo.patients.length > 0 && (() => {
                const open = wardInfo.patients.reduce((n, p) => n + p.jobs.filter((j) => !j.done).length, 0);
                const sick = wardInfo.patients.filter((p) => p.status === "sick").length;
                return (
                  <button onClick={openWard}>
                    <BedDouble size={14} /> <b>Ward round</b>
                    <span>{wardInfo.patients.length} patient{wardInfo.patients.length === 1 ? "" : "s"}{sick ? <> · <em className="sick">{sick} sick</em></> : null} · {open} job{open === 1 ? "" : "s"}</span>
                  </button>
                );
              })()}
              {activeCases > 0 && <button onClick={() => openCases()}><ClipboardList size={14} /> <b>Cases</b><span>{activeCases} active</span></button>}
              {readingCount > 0 && <button onClick={() => openResearch({ tab: "reading" })}><BookMarked size={14} /> <b>Reading list</b><span>{readingCount} paper{readingCount === 1 ? "" : "s"}</span></button>}
              {ptot.attempted > 0 && <button onClick={openPractice}><Target size={14} /> <b>Practice</b><span>{accuracy(ptot) ?? 0}% · <Flame size={12} /> {streak(practice.days)} day{streak(practice.days) === 1 ? "" : "s"}{practice.mistakes.length ? ` · ${practice.mistakes.length} to revise` : ""}</span></button>}
              {library.length > 0 && <button onClick={() => setView("library")}><Bookmark size={14} /> <b>Saved</b><span>{library.length} answer{library.length === 1 ? "" : "s"}</span></button>}
              {decks.length > 0 && <button onClick={() => setView("decks")}><Presentation size={14} /> <b>Decks</b><span>{decks.length}</span></button>}
              <button onClick={() => openView("today")} data-home="today"><CalendarDays size={14} /> <b>Today</b><span>Your day at a glance</span></button>
            </div>
          )}
        </div>
      </div>
      <p className="cx-home-note">
        <ShieldCheck size={13} /> Clinical decision support. {prefs.safetyReview ? "Every answer is checked by a second model, but" : "Cadus can make mistakes, so"} always verify before acting.
        <button onClick={() => setView("safety")}>How Cadus keeps answers safe</button>
        <span className="cx-home-legal"><a href={legalPath("terms")}>Terms</a><a href={legalPath("privacy")}>Privacy</a><a href={legalPath("disclaimer")}>Disclaimer</a></span>
      </p>
    </section>
  );

  const renderTools = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div><h1>Tools</h1><p>Six workspaces and {TOOL_MODES.length} specialised answer modes, from ranked differentials and referral letters to viva practice and ready-to-present lecture decks.</p></div>
      </header>
      <section className="cx-section cx-tools-ws">
        <div className="cx-section-h"><div><h2>Workspaces</h2><p>Each keeps its own data on this device</p></div></div>
        {workspaceTiles(true)}
        <div className="cx-ws-more">
          <button className="cx-btn" onClick={openProjects}><Folder size={14} /> Projects{projects.length ? ` · ${projects.length}` : ""}</button>
          <button className="cx-btn" onClick={() => setView("decks")}><Presentation size={14} /> Decks{decks.length ? ` · ${decks.length}` : ""}</button>
          <button className="cx-btn" onClick={() => setView("library")}><Library size={14} /> Library{library.length ? ` · ${library.length}` : ""}</button>
          <button className="cx-btn" onClick={() => setView("safety")}><ShieldCheck size={14} /> Clinical safety</button>
          <button className="cx-btn" onClick={() => setView("privacy")}><EyeOff size={14} /> Privacy centre</button>
        </div>
      </section>
      <section className="cx-section">
        <div className="cx-section-h"><div><h2>Answer modes</h2><p>Each one changes how Cadus structures its answer</p></div>{toolTabs}</div>
        <div className="cx-grid">{toolsFiltered.map((m) => toolCard(m, true))}</div>
      </section>
      <section className="cx-section">
        <div className="cx-section-h"><div><h2>Try an example</h2><p>Run a sample case to see how Cadus reasons and checks its answer</p></div></div>
        <div className="cx-ex-grid">
          {EXAMPLES.map((ex) => {
            const m = MODE[ex.mode];
            return (
              <button key={ex.text} className="cx-ex" onClick={() => send(ex.text, ex.mode)}>
                <span className="cx-badge"><m.icon size={12} /> {m.label}</span>
                <p>{ex.text}</p>
                <span className="cx-ex-f">Run example <ArrowRight size={15} /></span>
              </button>
            );
          })}
        </div>
      </section>
      <footer className="cx-trust">
        <span><ShieldCheck size={14} /> Every answer checked by a second AI model</span>
        <span><Globe size={14} /> Cites WHO, NICE, ICMR and PubMed with Sources on</span>
        <span><Laptop size={14} /> Chat history stays on this device</span>
        <span><Stethoscope size={14} /> Decision support, not a diagnosis</span>
      </footer>
    </section>
  );

  const libFiltered = library.filter((x) => {
    const q = libQuery.trim().toLowerCase();
    return !q || x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q);
  });

  const docsFiltered = docs.filter((d) => {
    const q = libQuery.trim().toLowerCase();
    return !q || d.title.toLowerCase().includes(q) || d.text.toLowerCase().includes(q);
  });

  const renderLibrary = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div>
          <h1>Library</h1>
          <p>{libTab === "docs" ? "Documents you've made or edited in Canvas: notes, letters and summaries, ready to export to Word or PDF." : "Answers you've saved for quick reference. Saved items stay even if you delete the chat."}</p>
        </div>
        <div className="cx-page-acts">
          {(libTab === "docs" ? docs.length : library.length) > 0 && (
            <label className="cx-search">
              <Search size={15} />
              <input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder={libTab === "docs" ? "Search documents" : "Search saved answers"} />
            </label>
          )}
          {libTab === "docs" && <button className="cx-btn primary" onClick={newDocument}><Plus size={15} /> New document</button>}
        </div>
      </header>
      <div className="cx-tabs cx-lib-tabs" role="tablist">
        <button role="tab" aria-selected={libTab === "saved"} className={libTab === "saved" ? "on" : ""} onClick={() => setLibTab("saved")}>Saved answers{library.length ? ` · ${library.length}` : ""}</button>
        <button role="tab" aria-selected={libTab === "docs"} className={libTab === "docs" ? "on" : ""} onClick={() => setLibTab("docs")}>Documents{docs.length ? ` · ${docs.length}` : ""}</button>
      </div>
      {libTab === "docs" ? (
        docs.length === 0 ? (
          <div className="cx-empty-state">
            <span className="cx-proj-ic" style={{ marginBottom: 0 }}><FilePen size={20} /></span>
            <h3>No documents yet</h3>
            <p>Open any answer in Canvas to edit it as a document, or start a blank one. Cadus can shorten, formalise, translate or rewrite it for patients, and you can download it for Word or as a PDF.</p>
            <button className="cx-btn" onClick={newDocument}><Plus size={15} /> New document</button>
          </div>
        ) : docsFiltered.length === 0 ? (
          <div className="cx-empty-state"><h3>No matches</h3><p>Try a different search term.</p></div>
        ) : (
          <div className="cx-lib">
            {docsFiltered.map((d) => {
              const m = d.mode ? MODE[d.mode as ModeId] : undefined;
              return (
                <article key={d.id} className="cx-lib-card cx-doc">
                  <div className="cx-lib-meta">
                    <span className="cx-badge"><FilePen size={12} /> {m && m.id !== "general" ? m.label : "Document"}</span>
                    <span>Edited {relTime(d.updatedAt)}</span>
                  </div>
                  <h3>{d.title}</h3>
                  <p>{markdownToText(d.text) || "Empty document"}</p>
                  <div className="cx-lib-acts">
                    <button onClick={() => setCanvasId(d.id)}><FilePen size={13} /> Open</button>
                    <button onClick={() => downloadWord(d.title, d.text, d.mode)} disabled={!d.text.trim()}><FileDown size={13} /> Word</button>
                    <button onClick={() => void exportPdf(d.title, [{ who: "", text: d.text }], { letterhead: lh, signature: SIGNED_MODES.has(d.mode ?? "") })} disabled={!d.text.trim()}><Download size={13} /> PDF</button>
                    <button onClick={() => printDoc(d.title, d.text, { mode: d.mode, large: d.mode === "patient" })} disabled={!d.text.trim()}><Printer size={13} /> Print</button>
                    <button className="danger" onClick={() => deleteDoc(d.id)}><Trash2 size={13} /> Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : library.length === 0 ? (
        <div className="cx-empty-state">
          <CadusMark size={40} />
          <h3>Nothing saved yet</h3>
          <p>Tap the bookmark under any answer to keep it here, ready for ward rounds, revision or teaching.</p>
          <button className="cx-btn" onClick={() => newChat()}><SquarePen size={15} /> Start a chat</button>
        </div>
      ) : libFiltered.length === 0 ? (
        <div className="cx-empty-state"><h3>No matches</h3><p>Try a different search term.</p></div>
      ) : (
        <div className="cx-lib">
          {libFiltered.map((x) => {
            const m = MODE[x.mode] ?? MODE.general;
            const exists = sessions.some((s) => s.id === x.sessionId);
            return (
              <article key={x.id} className="cx-lib-card">
                <div className="cx-lib-meta"><span className="cx-badge"><m.icon size={12} /> {m.label}</span><span>{relTime(x.at)}</span></div>
                <h3>{x.question}</h3>
                <p>{markdownToText(x.answer)}</p>
                <div className="cx-lib-acts">
                  {x.sessionId ? <button onClick={() => openSession(x.sessionId)} disabled={!exists} title={exists ? "Open the original chat" : "The original chat was deleted"}><ExternalLink size={13} /> Open chat</button> : (x.question.startsWith("Crew Huddle") ? <button onClick={() => openHuddle()} title="Saved from Crew Huddle"><Users2 size={13} /> Crew Huddle</button> : <button onClick={() => openView("watch")} title="Saved from Guideline Watch"><BellRing size={13} /> Guideline Watch</button>)}
                  <button onClick={() => { void navigator.clipboard?.writeText(withSources(referenceToPlain(x.answer), x.sources)); toast("Copied to clipboard"); }}><Copy size={13} /> Copy</button>
                  <button onClick={() => void exportPdf(x.question, [{ who: "Question", text: x.question }, { who: "Cadus", text: withSources(x.answer, x.sources) }])}><Download size={13} /> PDF</button>
                  <button className="danger" onClick={() => { setLibrary((l) => l.filter((y) => y.id !== x.id)); toast("Removed from Library"); }}><Trash2 size={13} /> Remove</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const editProject = (p: Project) => {
    setPop(null);
    setProjectDialog({ id: p.id, name: p.name, instructions: p.instructions });
  };

  /** Cadus Crew: the user's assistants and the ready-made ones. */
  const crewCard = (c: CrewMember, i: number) => {
    const key = `crew:${c.id}`;
    const tool = c.mode !== "general" ? MODE[c.mode as ModeId] : undefined;
    return (
      <div key={c.id} className={`cx-crew-card tone-${c.tone}`} style={{ ["--i" as string]: i }}>
        <button className="cx-crew-main" onClick={() => startCrew(c)} aria-label={`Chat with ${c.name}`}>
          <CrewBadge c={c} size={44} />
          <span className="t"><b>{c.name}</b><small>{c.tagline || "Your assistant"}</small></span>
          <span className="tags">
            {tool && <em><tool.icon size={11} /> {tool.short}</em>}
            {c.sources && <em><Globe size={11} /> Sources</em>}
            {c.knowledge?.length ? <em><BookOpen size={11} /> {c.knowledge.length} doc{c.knowledge.length === 1 ? "" : "s"}</em> : null}
            {styleSummary(crewStyles[c.id]) && <em data-crew-style={c.id}><Languages size={11} /> {styleSummary(crewStyles[c.id])}</em>}
            {crewMemory[c.id]?.length ? <em data-crew-mem={c.id}><Brain size={11} /> Remembers {crewMemory[c.id].length}</em> : null}
            {ratingSummary(crewRatings[c.id]).pct !== null && <em data-crew-rating={c.id}><ThumbsUp size={11} /> {ratingSummary(crewRatings[c.id]).pct}%</em>}
            {c.builtIn ? <em className="by">By Cadus</em> : <em className="by mine">{c.importedAt ? "Imported" : "Yours"}</em>}
          </span>
          {crewOrg.notes[c.id] && <span className="cx-crew-note" data-crew-note={c.id}><StickyNote size={11} /> {crewOrg.notes[c.id]}</span>}
        </button>
        <div className="cx-crew-acts">
          <button className="cx-btn primary sm" onClick={() => startCrew(c)}><MessageSquare size={14} /> Chat</button>
          <button className={`cx-ib cx-crew-fav ${crewFav.includes(c.id) ? "on" : ""}`} onClick={() => toggleFav(c.id)} aria-label={crewFav.includes(c.id) ? `Remove ${c.name} from favourites` : `Add ${c.name} to favourites`} aria-pressed={crewFav.includes(c.id)} data-crew-fav={c.id}><Star size={15} /></button>
          <div className="cx-rel" data-pop={key}>
            <button className={`cx-ib ${pop === key ? "open" : ""}`} onClick={() => togglePop(key)} aria-label={`More for ${c.name}`} aria-haspopup="menu" aria-expanded={pop === key}><Ellipsis size={16} /></button>
            {pop === key && (
              <div className="cx-pop cx-crew-menu" role="menu">
                {!c.builtIn && <button className="cx-pop-i" onClick={() => { setPop(null); setCrewEdit({ ...c }); }}><Pencil size={15} /> Edit</button>}
                <button className="cx-pop-i" onClick={() => { setPop(null); setCrewSettings(c); }} data-crew-settings={c.id}><SlidersHorizontal size={15} /> Style, memory, collections and note</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); setTemplatesCrew(c.id); setView("crewtemplates"); }} data-crew-templates={c.id}><LibraryBig size={15} /> Prompt templates</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); setCrewImprove(c); }} data-crew-improve={c.id}><Sparkles size={15} /> Rate &amp; improve</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); setCrewShare(c); }}><Share2 size={15} /> Share</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); openHuddle([c.id]); }}><Users2 size={15} /> Huddle with others</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); setSecondPick(c.id); setView("second"); }}><Scale size={15} /> Ask for a second opinion</button>
                <button className="cx-pop-i" onClick={() => { setPop(null); setCrewEdit({ ...c, id: "", builtIn: undefined, group: undefined, name: `${c.name} (copy)`.slice(0, CREW_NAME_MAX) }); }}><Copy size={15} /> {c.builtIn ? "Make my own version" : "Duplicate"}</button>
                {!c.builtIn && <button className="cx-pop-i danger" onClick={() => deleteCrew(c.id)}><Trash2 size={15} /> Remove</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const renderCrew = () => (
    <section className="cx-page cx-crew-page">
      <header className="cx-page-h cx-crew-h">
        <div>
          <p className="cx-crew-eyebrow"><Bot size={14} /> Cadus Crew</p>
          <h1>Assistants for every job on your list</h1>
          <p>Each one has its own instructions: a viva examiner, a discharge writer, a thesis guide. Chat with a ready-made one, or build your own in a minute. Cadus's accuracy standards and safety review still apply to every answer.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn" onClick={() => openHuddle()} data-crew="huddle"><Users2 size={15} /> Crew Huddle</button>
          <button className="cx-btn" onClick={() => openView("debate")} data-crew="debate"><Swords size={15} /> Debate</button>
          <button className="cx-btn" onClick={() => openView("playbooks")} data-crew="playbooks"><Workflow size={15} /> Playbooks</button>
          <button className="cx-btn" onClick={() => { setSecondPick(""); openView("second"); }} data-crew="second"><Scale size={15} /> Second opinion</button>
          <button className="cx-btn primary" onClick={() => setCrewEdit(blankCrew())} disabled={crewMine.length >= CREW_MAX}><Plus size={15} /> Create an assistant</button>
        </div>
      </header>
      {(() => { const w = crewWs.list.find((x) => x.id === crewWs.active); return w ? (
        <div className="cx-crew-ws" data-crew="ws-banner"><Briefcase size={15} /><b>{w.name}</b>{w.crewIds.map((id) => findCrew(id, crewMine)).filter((c): c is CrewMember => !!c).map((c) => <button key={c.id} className="cx-chip" onClick={() => startCrew(c)}><CrewBadge c={c} size={18} /> {c.name}</button>)}<button className="cx-link" onClick={() => openView("crewworkspaces")}>Change</button></div>
      ) : null; })()}
      <div className="cx-crew-box" data-crew="toolbox">
        {([
          ["quiz", Trophy, "Quiz Battle", "MCQs, timer, two players", () => openView("quizbattle")],
          ["caseround", Stethoscope, "Case round", "A case through specialists", () => openView("caseround")],
          ["rooms", MessagesSquare, "Chat rooms", "Group chat with assistants", () => openView("rooms")],
          ["compare", Columns3, "Compare", "Same question, side by side", () => openView("crewcompare")],
          ["voice", Mic, "Voice chat", "Talk and listen", () => openView("crewvoice")],
          ["prompts", LibraryBig, "Prompt templates", "Reusable prompts with blanks", () => { setTemplatesCrew(""); openView("crewtemplates"); }],
          ["drill", Flame, "Daily drill", "5 questions a day, streaks", () => openView("drill")],
          ["notes", StickyNote, "Notes & flashcards", "Saved answers, spaced review", () => openView("crewnotes")],
          ["checkins", BellRing, "Check-ins", "Daily tip, weekly plan", () => openView("checkins")],
          ["stats", Award, "Stats & badges", "Level, badges, leaderboard", () => openView("crewstats")],
          ["timeline", ScrollText, "Timeline", "Everything by date, export", () => openView("crewtimeline")],
          ["workspaces", Briefcase, "Workspaces", "Assistants per rotation", () => openView("crewworkspaces")],
          ["digest", CalendarRange, "Digest", "Your week or month in Crew", () => openView("crewdigest")],
          ["schedules", AlarmClock, "Schedules", "Daily viva, MCQs, drug of the day", () => openView("crewschedules")],
        ] as [string, LucideIcon, string, string, () => void][]).map(([k, Ic, l, sub, go]) => <button key={k} className="cx-crew-boxi" onClick={go} data-crew={k}><Ic size={18} /><b>{l}</b><small>{sub}</small></button>)}
      </div>
      <div className="cx-crew-tips">
        <span><AtSign size={14} /> Type <b>@</b> in any chat to bring in an assistant for one reply</span>
        <span><Users2 size={14} /> <button className="cx-link" onClick={() => openHuddle()}>Huddle</button>: ask up to four at once</span>
        <span><BookOpen size={14} /> Give your own assistants knowledge files</span>
        <span><Swords size={14} /> <button className="cx-link" onClick={() => openView("debate")}>Debate</button>: two argue, a judge decides</span>
        <span><Workflow size={14} /> <button className="cx-link" onClick={() => openView("playbooks")}>Playbooks</button>: chain them into a workflow</span>
        <span><Scale size={14} /> <button className="cx-link" onClick={() => { setSecondPick(""); openView("second"); }}>Second opinion</button>: have an expert review a plan</span>
        <span><Trophy size={14} /> <button className="cx-link" onClick={() => openView("quizbattle")}>Quiz Battle</button>: MCQs against the clock or a friend</span>
        <span><Stethoscope size={14} /> <button className="cx-link" onClick={() => openView("caseround")}>Case round</button>: a case passes through specialists in turn</span>
        <span><Languages size={14} /> Set each assistant's answer length, format and language from its menu</span>
        <span><MessagesSquare size={14} /> <button className="cx-link" onClick={() => openView("rooms")}>Chat rooms</button>: a group chat with several assistants</span>
        <span><Flame size={14} /> <button className="cx-link" onClick={() => openView("drill")}>Daily drill</button>: 5 questions a day, keep the streak</span>
        <span><Brain size={14} /> Type "Remember: …" in a chat and the assistant keeps it in mind</span>
        <span><ArrowRightLeft size={14} /> Hand a chat off to another assistant from the bar at the top of the chat</span>
        <span><StickyNote size={14} /> Save any assistant answer as a note and turn it into flashcards</span>
      </div>
      {schedDue(crewSchedules, schedNow).slice(0, 2).map((x) => { const c = findCrew(x.crewId, crewMine); return c ? (
        <div key={x.id} className="cx-crew-sched-due" data-crew="sched-due">
          <AlarmClock size={15} /><span><b>{c.name}</b> · {x.prompt.length > 90 ? `${x.prompt.slice(0, 90)}…` : x.prompt}</span>
          <button className="cx-btn primary" onClick={() => { setCrewSchedules((l) => l.map((y) => (y.id === x.id ? { ...y, lastDone: dateKey() } : y))); startCrew(c); setInput(x.prompt); }} data-sch-go>Start</button>
          <button className="cx-btn" onClick={() => setCrewSchedules((l) => l.map((y) => (y.id === x.id ? { ...y, lastDone: dateKey() } : y)))} data-sch-skip>Skip today</button>
        </div>
      ) : null; })}
      {dueCheckins(crewCheckins, dateKey()).length > 0 && (
        <button className="cx-crew-due" onClick={() => openView("checkins")} data-crew="checkin-due"><BellRing size={15} /> {dueCheckins(crewCheckins, dateKey()).length} check-in{dueCheckins(crewCheckins, dateKey()).length === 1 ? "" : "s"} ready from your assistants: open</button>
      )}
      <div className="cx-crew-find" data-crew="finder">
        <label className="cx-field"><span><Sparkles size={13} /> Who should I ask?</span><input className="cx-input" value={crewFind} onChange={(e) => setCrewFind(e.target.value.slice(0, 200))} placeholder="Describe your question, e.g. spinal anaesthesia dose for caesarean" data-crew="find" /></label>
        {crewFind.trim() && (() => { const sug = suggestCrew(crewFind, crewMine, 3); return sug.length ? <div className="cx-crew-sug" data-crew="suggest">{sug.map((c) => <button key={c.id} className="cx-chip" onClick={() => startCrew(c)}><CrewBadge c={c} size={20} /> {c.name}</button>)}</div> : <p className="cx-set-hint">No close match: try other words, or ask Cadus directly.</p>; })()}
      </div>
      <div className="cx-crew-bar" data-crew="bar">
        <label className="cx-search-l"><Search size={14} /><input className="cx-input" value={crewQ} onChange={(e) => setCrewQ(e.target.value.slice(0, 80))} placeholder={`Search ${BUILT_IN_CREW.length + crewMine.length} assistants`} aria-label="Search assistants" data-crew="q" /></label>
        <div className="cx-crew-chips" role="tablist" aria-label="Filter">{([["all", "All"], ["fav", `Favourites${crewFav.length ? ` ${crewFav.length}` : ""}`], ["mine", "Yours"], ...CREW_GROUPS.map((g) => [g, g])] as [CrewFilter, string][]).map(([v, l]) => <button key={v} role="tab" aria-selected={crewFilter === v} className={`cx-chip ${crewFilter === v ? "on" : ""}`} onClick={() => setCrewFilter(v)} data-crew-filter={v}>{l}</button>)}</div>
        <label className="cx-crew-sort"><span>Sort</span><select className="cx-select sm" value={crewSort} onChange={(e) => setCrewSort(e.target.value as CrewSort)} data-crew="sort"><option value="default">Default</option><option value="name">A–Z</option><option value="used">Most used</option></select></label>
      </div>
      {crewOrg.collections.length > 0 && (
        <div className="cx-crew-cols" data-crew="cols">
          <span><FolderHeart size={14} /> Collections:</span>
          {crewOrg.collections.map((col) => <button key={col.id} className={`cx-chip ${crewCol === col.id ? "on" : ""}`} onClick={() => setCrewCol(crewCol === col.id ? "" : col.id)} aria-pressed={crewCol === col.id} data-crew-col={col.name}>{col.name} <small>{col.ids.length}</small></button>)}
          {crewCol && <button className="cx-link danger" onClick={() => { setCrewOrg((o) => deleteCollection(o, crewCol)); setCrewCol(""); toast("Collection deleted (the assistants are kept)"); }} data-crew="col-delete">Delete this collection</button>}
        </div>
      )}
      {(crewQ.trim() || crewFilter !== "all" || crewSort !== "default" || (crewCol && crewOrg.collections.some((x) => x.id === crewCol))) ? (() => {
        const col = crewOrg.collections.find((x) => x.id === crewCol);
        const res = filterCrew([...crewMine, ...BUILT_IN_CREW].filter((c) => !col || col.ids.includes(c.id)), crewQ, crewFilter, crewSort, crewFav, crewUse);
        return (
          <div data-crew="results">
            <h2 className="cx-crew-sh">{res.length} assistant{res.length === 1 ? "" : "s"} <span>{crewQ.trim() ? `for "${crewQ.trim()}"` : ""}</span></h2>
            {res.length ? <div className="cx-crew-grid">{res.map((c, i) => crewCard(c, i))}</div> : <p className="cx-set-hint">Nothing matches. Clear the search or create your own assistant.</p>}
          </div>
        );
      })() : (<>
      {crewFav.length > 0 && <><h2 className="cx-crew-sh"><Star size={15} /> Favourites</h2><div className="cx-crew-grid" data-crew="favs">{crewFav.map((id) => findCrew(id, crewMine)).filter((c): c is CrewMember => !!c).map((c, i) => crewCard(c, i))}</div></>}
      {recentCrew(crewUse).length > 0 && <><h2 className="cx-crew-sh"><History size={15} /> Recently used</h2><div className="cx-crew-recent" data-crew="recent">{recentCrew(crewUse).map((id) => findCrew(id, crewMine)).filter((c): c is CrewMember => !!c).map((c) => <button key={c.id} className="cx-chip" onClick={() => startCrew(c)}><CrewBadge c={c} size={20} /> {c.name}</button>)}</div></>}
      <CrewBuilder
        build={(description) => invokeCadus({ action: "crew-build", description, model: prefs.model, modes: MODES.map((m) => ({ id: m.id, label: m.label })) })}
        onBuilt={(c) => setCrewEdit(c)}
        friendlyError={friendlyError}
        toast={toast}
        disabled={crewMine.length >= CREW_MAX}
      />
      <div className="cx-crew-tpl" data-crew="templates"><span>Start from a template:</span>{CREW_TEMPLATES.map((t) => <button key={t.label} className="cx-chip" onClick={() => setCrewEdit(t.make())} disabled={crewMine.length >= CREW_MAX} data-crew-tpl={t.label}><Plus size={13} /> {t.label}</button>)}</div>
      <div className="cx-crew-io">
        <button className="cx-btn sm" onClick={exportCrew} data-crew="export"><Download size={14} /> Export my assistants</button>
        <label className="cx-btn sm"><Upload size={14} /> Import from file<input type="file" accept="application/json,.json" hidden onChange={(e) => { void importCrew(e.target.files?.[0]); e.target.value = ""; }} data-crew="import-file" /></label>
        <button className="cx-btn sm" onClick={() => setCrewInsightsOpen((v) => !v)} aria-expanded={crewInsightsOpen} data-crew="insights-btn"><BarChart3 size={14} /> Insights</button>
        <button className="cx-btn sm" onClick={() => setPacksOpen((v) => !v)} aria-expanded={packsOpen} data-crew="packs-btn"><Package size={14} /> Team packs</button>
      </div>
      {packsOpen && (
        <CrewPacks
          key={packIncoming ? packIncoming.name : "packs"}
          mine={crewMine}
          modes={MODES.map((m) => m.id)}
          base={`${window.location.origin}${window.location.pathname}`}
          badge={(c, size) => <CrewBadge c={c} size={size} />}
          incoming={packIncoming}
          onImport={importPack}
          onAddPack={addPackCollection}
          onClose={() => { setPacksOpen(false); setPackIncoming(null); }}
          toast={toast}
        />
      )}
      {crewInsightsOpen && (() => {
        const byCrew: Record<string, number> = {};
        sessions.forEach((x) => { if (x.crewId) byCrew[x.crewId] = (byCrew[x.crewId] ?? 0) + 1; });
        const ins = crewInsights(crewMine, crewUse, byCrew);
        return (
          <div className="cx-cmp-out" data-crew="insights">
            <div className="cx-sim-stats">
              <div><b>{ins.total}</b><small>assistants ({ins.builtIn} by Cadus, {ins.yours} yours)</small></div>
              <div><b>{ins.usedEver}</b><small>you have started chats with</small></div>
              <div><b>{ins.docs}</b><small>knowledge files ({Math.round(ins.chars / 1000)}k characters)</small></div>
            </div>
            {ins.top.length ? <><h4>Most used</h4><ol className="cx-c23-steps">{ins.top.map((t) => <li key={t.c.id}><b>{t.c.name}</b>: {t.chats} chat{t.chats === 1 ? "" : "s"}, opened {t.n} time{t.n === 1 ? "" : "s"}</li>)}</ol></> : <p className="cx-set-hint">Start chats with assistants and your favourites will show here.</p>}
          </div>
        );
      })()}
      <h2 className="cx-crew-sh">Your crew <span>{crewMine.length ? crewMine.length : ""}</span></h2>
      {crewMine.length ? (
        <div className="cx-crew-grid">{crewMine.map((c, i) => crewCard(c, i))}</div>
      ) : (
        <button className="cx-crew-new" onClick={() => setCrewEdit(blankCrew())}>
          <span className="ic"><Plus size={20} /></span>
          <span><b>Create your first assistant</b><small>For example a rotation buddy that knows your unit's protocols, or an examiner for your specialty</small></span>
        </button>
      )}
      <CrewPasteImport modes={MODES.map((m) => m.id)} onFound={setCrewImport} toast={toast} />
      {CREW_GROUPS.map((g) => {
        const group = BUILT_IN_CREW.filter((c) => (c.group ?? "Clinical") === g);
        return group.length ? (
          <div key={g}>
            <h2 className="cx-crew-sh">{g === "Study" ? "For study and exams" : g === "Clinical" ? "For the wards and OPD" : g === "Specialists" ? "Specialist consults" : g === "Super-specialists" ? "Super-specialist consults" : g === "AYUSH & Integrative" ? "AYUSH and integrative medicine (evidence-checked)" : g === "Allied & Public Health" ? "Allied and public health" : g === "Exams & Careers" ? "Exams and careers" : g === "Dental" ? "Dental specialists" : g === "Nursing & Midwifery" ? "Nursing and midwifery" : g === "Patient Languages" ? "Patient explainers in Indian languages" : g === "Writing" ? "For notes and patients" : "For research"} <span>By Cadus</span></h2>
            <div className="cx-crew-grid">{group.map((c, i) => crewCard(c, i + crewMine.length))}</div>
          </div>
        ) : null;
      })}
      </>)}
    </section>
  );

  const renderProjects = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div>
          <h1>Projects</h1>
          <p>Keep related chats together and give Cadus standing instructions for each one, such as a rotation, an exam or a thesis.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn primary" onClick={() => newProject()}><Plus size={15} /> New project</button>
        </div>
      </header>
      {projects.length === 0 ? (
        <div className="cx-empty-state">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><Folder size={20} /></span>
          <h3>Create your first project</h3>
          <p>A project holds its own chats and instructions, so Cadus answers every question in it with the right audience, focus and format.</p>
          <div className="cx-ideas">
            {PROJECT_IDEAS.map((n) => (
              <button key={n} className="cx-chip" onClick={() => setProjectDialog({ name: n, instructions: "" })}><Plus size={14} /> {n}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="cx-projects">
          {sortedProjects.map((p) => {
            const st = projectStats[p.id];
            const n = st?.chats ?? 0;
            return (
              <button key={p.id} className="cx-proj" onClick={() => openProject(p.id)}>
                <span className="cx-proj-ic"><Folder size={18} /></span>
                <b>{p.name}</b>
                <small>{p.instructions || "No instructions yet"}</small>
                <span className="cx-proj-f"><MessageSquare size={13} /> {n} chat{n === 1 ? "" : "s"} · Updated {relTime(Math.max(p.updatedAt, st?.last ?? 0))}</span>
              </button>
            );
          })}
          <button className="cx-proj add" onClick={() => newProject()}><span className="cx-proj-ic"><FolderPlus size={18} /></span>New project</button>
        </div>
      )}
    </section>
  );

  const renderProject = () => {
    if (!project) return null;
    const list = listed.filter((s) => s.projectId === project.id);
    const ids = new Set(list.map((s) => s.id));
    const saved = library.filter((x) => ids.has(x.sessionId)).length;
    const last = Math.max(project.updatedAt, projectStats[project.id]?.last ?? 0);
    return (
      <section className="cx-page">
        <button className="cx-back" onClick={openProjects}><ArrowLeft size={15} /> All projects</button>
        <header className="cx-page-h">
          <div>
            <h1>{project.name}</h1>
            <p>{list.length ? `${list.length} chat${list.length === 1 ? "" : "s"} · Updated ${relTime(last)}` : `Created ${relTime(project.createdAt)}`}</p>
          </div>
          <div className="cx-page-acts">
            <button className="cx-btn" onClick={() => editProject(project)}><Pencil size={14} /> Edit</button>
            <div className="cx-rel" data-pop="proj">
              <button className="cx-ib" onClick={() => { setConfirmProjectDelete(false); togglePop("proj"); }} aria-label="Project options" aria-haspopup="menu" aria-expanded={pop === "proj"}>
                <MoreHorizontal size={18} />
              </button>
              {pop === "proj" && (
                <div className="cx-pop cx-proj-menu" role="menu">
                  {confirmProjectDelete ? (
                    <>
                      <p className="cx-pop-gl">Delete “{clip(project.name, 24)}”? Its chats stay in your list.</p>
                      <button className="cx-pop-i danger" onClick={() => deleteProject(project.id)}><Trash2 size={16} /> Delete project</button>
                      <button className="cx-pop-i" onClick={() => setConfirmProjectDelete(false)}><X size={16} /> Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="cx-pop-i" onClick={() => editProject(project)}><Pencil size={16} /> Edit name and instructions</button>
                      <button
                        className="cx-pop-i"
                        onClick={() => {
                          setPop(null);
                          downloadJSON(`cadus-project-${today()}.json`, { exportedAt: new Date().toISOString(), project, sessions: list });
                        }}
                      >
                        <Download size={16} /> Export project
                      </button>
                      <div className="cx-pop-sep" />
                      <button className="cx-pop-i danger" onClick={() => setConfirmProjectDelete(true)}><Trash2 size={16} /> Delete project</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="cx-proj-layout">
          <div>
            {composer("hero")}
            <div className="cx-proj-chats">
              <p className="cx-sub-h"><span>Chats in this project</span>{list.length > 0 && <span>{list.length}</span>}</p>
              {list.length === 0 ? (
                <div className="cx-hist-empty">Start a chat above and it is saved here. You can also move an existing chat in from its ⋯ menu in the sidebar.</div>
              ) : (
                list.map((s) => {
                  const I = MODE[sessionMode(s)].icon;
                  const reply = [...s.messages].reverse().find((m) => m.role === "assistant" && !m.error && !m.stopped);
                  return (
                    <button key={s.id} className="cx-pchat" onClick={() => openSession(s.id)}>
                      <span className="cx-pchat-ic"><I size={16} /></span>
                      <span className="cx-pchat-t">
                        <b>{s.title}</b>
                        <small>{relTime(s.updatedAt)}{reply ? ` · ${clip(markdownToText(reply.content), 96)}` : ""}</small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <aside>
            <div className="cx-pcard">
              <div className="cx-pcard-h">
                <b><SlidersHorizontal size={14} /> Instructions</b>
                <button onClick={() => editProject(project)}>{project.instructions ? "Edit" : "Add"}</button>
              </div>
              {project.instructions ? (
                <p>{project.instructions}</p>
              ) : (
                <p className="muted">Tell Cadus how to answer in this project: who it is for, what to focus on, the format you prefer and the guidelines to follow.</p>
              )}
            </div>
            <div className="cx-pcard">
              <div className="cx-pcard-stats">
                <div><b>{list.length}</b><small>Chats</small></div>
                <div><b>{saved}</b><small>Saved answers</small></div>
              </div>
            </div>
            <p className="cx-pcard-note"><ShieldCheck size={14} /> Instructions shape focus and format. Cadus's clinical standards and safety review always apply.</p>
          </aside>
        </div>
      </section>
    );
  };

  const renderDecks = () => (
    <section className="cx-page">
      <header className="cx-page-h">
        <div>
          <h1>Decks</h1>
          <p>Every lecture deck you've made with Cadus, ready to present in one click.</p>
        </div>
        <div className="cx-page-acts">
          <button className="cx-btn primary" onClick={() => startTool("slides")}><Plus size={15} /> New deck</button>
        </div>
      </header>
      {decks.length === 0 ? (
        <div className="cx-empty-state">
          <span className="cx-proj-ic" style={{ marginBottom: 0 }}><Presentation size={20} /></span>
          <h3>No decks yet</h3>
          <p>Ask for a lecture on any topic and Cadus designs a complete teaching deck, fact-checked slide by slide, that you can present straight away.</p>
          <button className="cx-btn" onClick={() => startTool("slides")}><Presentation size={15} /> Make a deck</button>
        </div>
      ) : (
        <div className="cx-decks">
          {decks.map(({ s, m }) => {
            const d = m.deck!;
            return (
              <article key={m.id} className="cx-dk">
                <button className="cx-dk-cover" onClick={() => setDeck(d)} aria-label={`Present ${d.title}`}>
                  <span className="cx-dk-k"><CadusMark size={14} variant="mono" color="rgba(255,255,255,.72)" /> Lecture deck</span>
                  <b>{d.title}</b>
                  <small>{d.subtitle}</small>
                  <span className="cx-dk-play"><Play size={15} fill="currentColor" /></span>
                </button>
                <div className="cx-dk-b">
                  <div className="cx-dk-meta">
                    <span>{d.slides.length} slides · {relTime(m.at)}</span>
                    {m.review && <span className="cx-rv"><ShieldCheck size={12} /> Fact-checked</span>}
                  </div>
                  <div className="cx-lib-acts">
                    <button onClick={() => setDeck(d)}><Play size={13} /> Present</button>
                    <button onClick={() => openSession(s.id)}><ExternalLink size={13} /> Open chat</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  /** For each answer: the question it answers and any interactions between the drugs it names. */
  const answerContext = useMemo(() => {
    const out: Record<string, { q: string; ix: IxMatch[] }> = {};
    let q = "";
    for (const m of messages) {
      if (m.role === "user") { q = m.content; continue; }
      const checkable = !m.error && !m.stopped && !["mcq", "slides", "research", "viva", "osce", "patient", "evidence"].includes(m.mode);
      out[m.id] = { q, ix: checkable ? checkText(q).matches : [] };
    }
    return out;
  }, [messages]);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  /** A viva or OSCE that hasn't been scored yet. */
  const sim = lastUser && ROLEPLAY.has(lastUser.mode) && !/##\s*(Scorecard|Examiner feedback)/i.test(lastAssistant?.content ?? "") ? lastUser.mode : null;

  /** Thumbs-down form: what was wrong, and an option to get a better answer straight away. */
  const renderFeedback = () => fb && (
    <div className="cx-fb" role="group" aria-label="Feedback on this answer">
      <div className="cx-fb-h">
        <b>What could be better?</b>
        <button className="cx-ib" onClick={() => setFb(null)} aria-label="Close feedback"><X size={16} /></button>
      </div>
      <div className="cx-fb-chips">
        {FEEDBACK_REASONS.map((r) => {
          const on = fb.reasons.includes(r);
          return (
            <button key={r} className={on ? "on" : ""} aria-pressed={on} onClick={() => setFb({ ...fb, reasons: on ? fb.reasons.filter((x) => x !== r) : [...fb.reasons, r] })}>{r}</button>
          );
        })}
      </div>
      <textarea
        value={fb.comment}
        onChange={(e) => setFb({ ...fb, comment: e.target.value })}
        placeholder="Add details (optional), for example the dose or guideline that should be used"
        maxLength={600}
        aria-label="Feedback details"
      />
      <div className="cx-fb-f">
        <span>Saved with this answer on this device.</span>
        <button className="cx-btn" onClick={() => submitFeedback(false)}>Submit</button>
        <button className="cx-btn primary" onClick={() => submitFeedback(true)} disabled={!!pending}><RefreshCw size={14} /> Improve this answer</button>
      </div>
    </div>
  );

  /** One answer, with its versions (from regenerating), actions and follow-ups. */
  const renderAnswer = (m: Msg) => {
    const all = allVersions(m);
    const want = versionView[m.id];
    const vi = want === undefined || want < 0 || want >= all.length ? all.length - 1 : want;
    const v = all[vi];
    // The version on screen, under this message's id, for copy, save, read aloud and export.
    const shown: Msg = vi === all.length - 1 ? m : { ...v, id: m.id, versions: m.versions, feedback: m.feedback };
    const src = safeSources(v.sources);
    const doc = docByMsg.get(m.id);
    const partial = !!m.stopped && !!m.content.trim() && m.content !== "Response stopped.";
    const menuKey = `msg:${m.id}`;
    return (
      <div key={m.id} className="cx-a" data-mid={m.id}>
        <div className="cx-a-h">
          {m.mention ? <span className="cx-a-crew" title={`${m.mention.name}, from Cadus Crew`}><CrewBadge c={m.mention} size={20} /> {m.mention.name}</span> : <CadusMark size={20} title="Cadus" />}
          <span className={`cx-a-kind ${v.deep ? "deep" : ""}`}>{v.deep ? <><Telescope size={13} /> Deep Dive</> : MODE[v.mode]?.label ?? "Answer"}</span>
          {!m.error && !m.stopped && <span className="cx-a-model" title={v.library ? "Answered from the Medical Library" : "The model that drafted this answer"}>{v.library ? "Medical Library" : modelLabel(v.model, v.provider)}</span>}
          <time className="cx-a-time" dateTime={new Date(v.at).toISOString()}>{new Date(v.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
          {v.review && (
            <span className="cx-rv"><ShieldCheck size={13} /> Safety-reviewed{v.review.changes.length ? ` · ${v.review.changes.length} correction${v.review.changes.length > 1 ? "s" : ""}` : ""}</span>
          )}
          {v.review && <span className={`cx-conf ${v.review.confidence}`}>{CONF_LABEL[v.review.confidence]}</span>}
          {v.protocols?.length ? (
            <span className="cx-instchip" title={`Your institution's protocols went with this question: ${v.protocols.join("; ")}`}>
              <Building2 size={13} /> {v.protocols.length === 1 ? `Local protocol: ${v.protocols[0]}` : `${v.protocols.length} local protocols`}
            </span>
          ) : null}
          {v.library && (
            <span className="cx-libchip" title={`Library mode: ${v.library.reason}`}>
              <Library size={13} /> Medical Library · {v.library.mode === "llm" ? "written by the backup model" : "quoted"}
            </span>
          )}
        </div>
        {m.error ? (
          <div className="cx-err">
            <AlertTriangle size={16} />
            <span>{m.content}</span>
            <button onClick={() => regenerate(m.id)} disabled={!!pending}><RefreshCw size={13} /> Retry</button>
          </div>
        ) : m.stopped ? (
          <>
            {partial && <MdBlock text={m.content} className="is-stopped" />}
            <div className="cx-stopped">
              <span>
                {!partial ? "Response stopped." : prefs.safetyReview && !ROLEPLAY.has(m.mode) ? "Stopped before it was finished. This part wasn't safety-reviewed." : "Stopped before it was finished."}
              </span>
              <button onClick={() => regenerate(m.id)} disabled={!!pending}><RefreshCw size={13} /> Regenerate</button>
            </div>
          </>
        ) : (
          <>
            {v.deep && (
              <details className="cx-deepsum">
                <summary>
                  <Telescope size={14} />
                  <span>Researched {v.deep.papers} PubMed paper{v.deep.papers === 1 ? "" : "s"}{v.deep.web ? ` and ${v.deep.web} guideline source${v.deep.web === 1 ? "" : "s"}` : ""} · {src.length} cited</span>
                  <ChevronDown size={14} className="chev" />
                </summary>
                <ol>
                  {v.deep.steps.map((st) => (
                    <li key={st.id} className={st.state}>{st.state === "skip" ? <AlertTriangle size={13} /> : <Check size={13} />}<span>{st.label}{st.detail && <small>{st.detail}</small>}</span></li>
                  ))}
                </ol>
              </details>
            )}
            <MdBlock text={v.content} cites={src.length} outline />
            {src.length > 0 && (
              <div className="cx-sources">
                <div className="cx-src-h">
                  <Globe size={14} /> <span>References · {src.length}</span>
                  <button onClick={() => openSources(m.id)} title="Open the sources beside the chat"><PanelRight size={13} /> View all</button>
                </div>
                <ol>
                  {src.map((x) => (
                    <li key={x.n}>
                      <a href={x.url} target="_blank" rel="noopener noreferrer" title={x.title}>
                        <span className="n">{x.n}</span><span className="t">{x.title}</span><span className="d">{hostOf(x.url)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {v.review && (
              <details className="cx-rvd">
                <summary><ShieldCheck size={14} /> Safety review details <ChevronDown size={14} className="chev" /></summary>
                <div className="cx-rvd-b">
                  {v.review.checked.length > 0 && (
                    <div className="cx-rvd-row"><span>Checked</span><div className="chips">{v.review.checked.map((c) => <em key={c}>{c}</em>)}</div></div>
                  )}
                  <div className="cx-rvd-row">
                    <span>Corrections</span>
                    {v.review.changes.length ? <ul>{v.review.changes.map((c) => <li key={c}>{c}</li>)}</ul> : <p>None needed. The draft was approved as written.</p>}
                  </div>
                  <p className="cx-rvd-note">Automated review by {modelLabel(v.review.model, v.review.provider)}. It catches most errors but cannot guarantee there are none. Confirm doses and decisions against current guidelines and your local protocols.</p>
                </div>
              </details>
            )}
            {v.reviewNote && <div className="cx-rvwarn"><ShieldAlert size={15} /> {v.reviewNote}</div>}
            {(answerContext[m.id]?.ix.length ?? 0) > 0 && (
              <InteractionNotice
                matches={answerContext[m.id].ix}
                onOpen={() => openCalculators({ tab: "ix", drugs: checkText(answerContext[m.id].q).drugs.map((d) => d.label) })}
              />
            )}
            {v.deck && (
              <div className="cx-deck">
                <span className="cx-deck-ic"><Presentation size={21} /></span>
                <span className="cx-deck-t"><b>{v.deck.title}</b><small>{v.deck.slides.length} slides · Lecture deck</small></span>
                <button className="cx-deck-go" onClick={() => setDeck(v.deck!)}><Play size={13} fill="currentColor" /> Present</button>
              </div>
            )}
            {doc ? (
              <button className="cx-cvcard" onClick={() => setCanvasId(doc.id)}>
                <span className="ic"><FilePen size={18} /></span>
                <span className="t"><b>{doc.title}</b><small>Document · edited {relTime(doc.updatedAt)}</small></span>
                <span className="go">Open <ArrowRight size={14} /></span>
              </button>
            ) : DOC_MODES.has(m.mode) && !v.deck ? (
              <button className="cx-cvcard offer" onClick={() => openCanvas(shown)}>
                <span className="ic"><FilePen size={18} /></span>
                <span className="t"><b>Edit as a document</b><small>Refine or translate it, then download it for Word or as a PDF</small></span>
                <span className="go">Open in Canvas <ArrowRight size={14} /></span>
              </button>
            ) : null}
            <div className="cx-a-acts">
              {all.length > 1 && (
                <span className="cx-ver" role="group" aria-label={`Answer ${vi + 1} of ${all.length}`}>
                  <button onClick={() => setVersionView((x) => ({ ...x, [m.id]: vi - 1 }))} disabled={vi === 0} aria-label="Previous answer"><ChevronLeft size={15} /></button>
                  <span>{vi + 1} / {all.length}</span>
                  <button onClick={() => setVersionView((x) => ({ ...x, [m.id]: vi + 1 }))} disabled={vi === all.length - 1} aria-label="Next answer"><ChevronRight size={15} /></button>
                </span>
              )}
              <button className="cx-act cx-tip" data-tip={copied === m.id ? "Copied" : "Copy"} onClick={() => copy(shown)} aria-label="Copy">{copied === m.id ? <Check size={16} /> : <Copy size={16} />}</button>
              <button className={`cx-act cx-tip ${m.feedback === "up" ? "on" : ""}`} data-tip="Good answer" onClick={() => thumb(m, "up")} aria-label="Good answer" aria-pressed={m.feedback === "up"}><ThumbsUp size={16} /></button>
              <button className={`cx-act cx-tip ${m.feedback === "down" ? "on" : ""}`} data-tip="Bad answer" onClick={() => thumb(m, "down")} aria-label="Bad answer" aria-pressed={m.feedback === "down"}><ThumbsDown size={16} /></button>
              {(m.mention?.id ?? active?.crewId) && <button className="cx-act cx-tip" data-tip="Save to Crew notes" onClick={() => { const cid = m.mention?.id ?? active?.crewId; if (cid) { setCrewNotes((n) => addNote(n, cid, shown.content)); toast("Saved to Crew notes"); } }} aria-label="Save to Crew notes" data-crew-note-save><StickyNote size={16} /></button>}
              <button className="cx-act cx-tip" data-tip="Fact-check" onClick={() => { const i = (active?.messages ?? []).findIndex((x) => x.id === m.id); const q = [...(active?.messages ?? []).slice(0, Math.max(0, i))].reverse().find((x) => x.role === "user")?.content ?? ""; setFactCheck({ question: q, answer: shown.content }); }} aria-label="Fact-check this answer" data-fact-check><SearchCheck size={16} /></button>
              <button className="cx-act cx-tip" data-tip="Translate" onClick={() => setTranslateMsg(shown.content)} aria-label="Translate this answer" data-translate><Languages size={16} /></button>
              <button className="cx-act cx-tip" data-tip="Share card" onClick={() => { const i = (active?.messages ?? []).findIndex((x) => x.id === m.id); const q = [...(active?.messages ?? []).slice(0, Math.max(0, i))].reverse().find((x) => x.role === "user")?.content ?? ""; const cr = findCrew(m.mention?.id ?? active?.crewId, crewMine); setShareCard({ title: (stripPlaceholders(q) || q || active?.title || "").slice(0, 160), text: shown.content, by: cr?.name ?? "Cadus", tone: cr?.tone ?? "teal" }); }} aria-label="Make a share card" data-share-card><Share2 size={16} /></button>
              <button className={`cx-act cx-tip ${speakingId === m.id ? "on" : ""}`} data-tip={speakingId === m.id ? "Stop reading" : "Read aloud"} onClick={() => speak(shown)} aria-label="Read aloud">
                {speakingId === m.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button className="cx-act cx-tip" data-tip="Regenerate" onClick={() => regenerate(m.id)} disabled={!!pending} aria-label="Regenerate"><RefreshCw size={16} /></button>
              {DOC_MODES.has(m.mode) && m.mode !== "evidence" && (
                <button className="cx-act cx-tip" data-tip={m.mode === "patient" ? "Print handout" : "Print"} onClick={() => printDoc(answerTitle(m, v.content), liftKeyPoints(v.content), { mode: m.mode, sources: src, large: m.mode === "patient" })} aria-label={m.mode === "patient" ? "Print handout" : "Print"}><Printer size={16} /></button>
              )}
              <button className={`cx-act cx-tip ${savedIds.has(m.id) ? "on" : ""}`} data-tip={savedIds.has(m.id) ? "Saved to Library" : "Save to Library"} onClick={() => toggleSave(shown)} aria-label="Save to Library">
                {savedIds.has(m.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
              <div className="cx-rel" data-pop={menuKey}>
                <button className={`cx-act cx-tip ${pop === menuKey ? "open" : ""}`} data-tip="More" onClick={() => togglePop(menuKey)} aria-label="More actions" aria-haspopup="menu" aria-expanded={pop === menuKey}><Ellipsis size={16} /></button>
                {pop === menuKey && (
                  <div className="cx-pop cx-msg-menu" role="menu">
                    <button className="cx-pop-i" onClick={() => { setPop(null); openCanvas(shown); }}><FilePen size={16} /> {doc ? "Open in Canvas" : "Edit in Canvas"}</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); branchFrom(m.id); }} disabled={!!pending}><GitBranch size={16} /> Branch in a new chat</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); setCardSeed({ title: answerTitle(m, v.content), text: v.content }); openView("flashcards"); }}><Layers size={16} /> Make flashcards</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); downloadWord(answerTitle(m, v.content), withSources(v.content, v.sources), m.mode); }}><FileDown size={16} /> Download for Word</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); exportAnswer(shown); }}><Download size={16} /> Download as PDF</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); printDoc(answerTitle(m, v.content), liftKeyPoints(v.content), { mode: m.mode, sources: src, large: m.mode === "patient" }); }}><Printer size={16} /> {m.mode === "patient" ? "Print handout" : "Print"}</button>
                    <button className="cx-pop-i" onClick={() => { setPop(null); setShareItem({ kind: "answer", title: answerTitle(m, v.content), question: stripPlaceholders(questionFor(m)) || questionFor(m), answer: referenceForDocument(v.content), sources: src.length ? src : undefined, reviewed: !!v.review, at: Date.now() }); }}><Share2 size={16} /> Share link or QR</button>
                    {typeof navigator !== "undefined" && "share" in navigator && <button className="cx-pop-i" onClick={() => { setPop(null); void shareAnswer(shown); }}><Share2 size={16} /> Send with…</button>}
                    {active?.caseId && cases.some((c) => c.id === active.caseId) && (
                      <button className="cx-pop-i" onClick={() => { setPop(null); addAnswerToCase(active.caseId!, shown); }}><ClipboardList size={16} /> Add to case timeline</button>
                    )}
                    {(lh || SIGNED_MODES.has(m.mode)) && <div className="cx-pop-sep" />}
                    {lh ? (
                      <p className="cx-pop-gl">Word, PDF and print use your letterhead</p>
                    ) : SIGNED_MODES.has(m.mode) ? (
                      <button className="cx-pop-i" onClick={() => openSettings("letterhead")}><FileSignature size={16} /> Add your letterhead</button>
                    ) : null}
                  </div>
                )}
              </div>
              <span className="cx-a-by">
                {v.library
                  ? `${v.library.mode === "llm" ? BACKUP_MODEL : "Quoted"} · Cadus Medical Library`
                  : shortModel(modelLabel(v.model, v.provider))}
                {v.review ? ` · reviewed by ${shortModel(modelLabel(v.review.model, v.review.provider))}` : ""}
                {v.took ? ` · ${fmtTook(v.took)}` : ""}
              </span>
            </div>
            {fb?.id === m.id && renderFeedback()}
            {m.id === lastAssistant?.id && !pending && (() => {
              const ctx = answerContext[m.id];
              if (!ctx || ROLEPLAY.has(m.mode)) return null;
              const calcs = STUDY_MODES.has(m.mode) || m.mode === "evidence" ? [] : suggestCalculators(ctx.q, m.content);
              const ward = CASE_MODES.has(m.mode) || (m.mode === "general" && looksLikeCase(ctx.q));
              if (!calcs.length && !ward) return null;
              const lang = wardLang || prefs.language;
              return (
                <div className="cx-next">
                  {ward && (
                    <div className="cx-next-row">
                      <span className="cx-next-l">Next for this patient</span>
                      {WARD_ACTIONS.filter((w) => w.mode !== m.mode).map((w) => (w.id === "patient" ? (
                        <span key={w.id} className="cx-ward-lang">
                          <button className="cx-chip2" onClick={() => send(w.prompt(lang), "patient", { lang })}><Users size={14} /> {w.label}</button>
                          <select value={lang} onChange={(e) => setWardLang(e.target.value)} aria-label="Language for the patient">
                            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                          </select>
                        </span>
                      ) : (
                        <button key={w.id} className="cx-chip2" onClick={() => send(w.prompt(prefs.language), w.mode)}>
                          {w.id === "rounds" ? <ClipboardCheck size={14} /> : w.id === "referral" ? <Mail size={14} /> : <FileText size={14} />} {w.label}
                        </button>
                      )))}
                    </div>
                  )}
                  {calcs.length > 0 && (
                    <div className="cx-next-row">
                      <span className="cx-next-l">Calculate</span>
                      {calcs.map((c) => (
                        <button key={c.id} className="cx-chip2" onClick={() => openCalculators({ calc: c.id })}><Calculator size={14} /> {c.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            {m.id === lastAssistant?.id && !pending && (m.followups?.length || FOLLOW[m.mode].length > 0) && (
              <div className={`cx-follow ${m.followups?.length ? "smart" : ""}`}>
                <p>{m.followups?.length ? <><Sparkles size={13} /> Ask next</> : "Suggested follow-ups"}</p>
                {m.followups?.length
                  ? m.followups.map((f, i) => (
                    <button key={f} style={{ ["--i" as string]: i }} onClick={() => send(f, m.mode)}><CornerDownRight size={15} /> {f}</button>
                  ))
                  : FOLLOW[m.mode].map((f) => (
                    <button key={f.text} onClick={() => send(f.text, f.mode ?? m.mode)}><CornerDownRight size={15} /> {f.text}</button>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  /** The answer being written: progress steps, then the text as it streams in. */
  const renderPending = (p: NonNullable<typeof pending>) => {
    const reviewer = STUDY_MODES.has(p.mode) || p.deep ? MODEL_DEF.medius.short : MODEL_DEF.magnus.short;
    const draftLabel = p.mode === "evidence"
      ? "Reading the PubMed abstracts and summarising the evidence"
      : p.think
      ? `Thinking it through carefully${p.search ? " and searching trusted sources" : ""}`
      : p.doc ? `Reading the attached document${p.search ? " and searching trusted sources" : ""}`
      : p.search ? "Searching trusted medical sources and drafting"
      : p.image ? "Reviewing the image"
      : MODE[p.mode].busy;
    const status = p.mode === "slides" ? "Designing your deck"
      : p.deep && p.stage === "draft" ? "Deep Dive"
      : p.stage === "review" ? "Safety review"
      : p.stage === "library" ? "Library mode"
      : p.think ? "Thinking deeply"
      : "Drafting";
    const skeleton = (
      <div className="cx-sk-wrap" aria-hidden>
        <i className="cx-sk" style={{ width: "94%" }} />
        <i className="cx-sk" style={{ width: "82%" }} />
        <i className="cx-sk" style={{ width: "60%" }} />
      </div>
    );
    return (
      <div className="cx-live-a">
        <div className="cx-a-h">
          <CadusMark size={20} thinking title="Cadus is working" />
          <span className="cx-live-st">{status}{elapsed > 0 && <em> · {elapsed}s</em>}</span>
        </div>
        <div className="cx-think">
          <div className="cx-steps">
            {p.mode === "slides" ? (
              <div className="cx-step on"><i className="cx-spin" /> {p.review ? "Designing your deck and fact-checking every slide" : "Designing your deck"}</div>
            ) : p.deep ? (
              <>
                {p.deep.length === 0 && <div className="cx-step on"><i className="cx-spin" /> Starting the research</div>}
                {p.deep.map((st) => (
                  <div key={st.id} className={`cx-step cx-deep-step ${st.state === "on" && p.stage === "draft" ? "on" : st.state === "skip" ? "skip" : "done"}`}>
                    {st.state === "on" && p.stage === "draft" ? <i className="cx-spin" /> : st.state === "skip" ? <AlertTriangle size={15} className="warn" /> : <Check size={15} />}
                    <span><span className="l">{st.label}</span>{st.detail && <small>{st.detail}</small>}</span>
                  </div>
                ))}
                {p.review && (
                  <div className={`cx-step ${p.stage === "review" ? "on" : "todo"}`}>
                    {p.stage === "review" ? <i className="cx-spin" /> : <i className="cx-dot" />}
                    Safety review by {reviewer}: claims, doses and citations
                  </div>
                )}
              </>
            ) : (
              <>
                {p.stage === "library" ? (
                  <>
                    <div className="cx-step done"><AlertTriangle size={15} className="warn" /> The main AI is unavailable (no AI credits). Switching to Library mode</div>
                    <div className="cx-step on"><i className="cx-spin" /> Searching the Cadus Medical Library and preparing the answer</div>
                  </>
                ) : (
                  <div className={`cx-step ${p.stage === "draft" ? "on" : "done"}`}>
                    {p.stage === "draft" ? <i className="cx-spin" /> : <Check size={15} />}
                    {draftLabel}
                  </div>
                )}
                {p.review && (
                  <div className={`cx-step ${p.stage === "review" ? "on" : "todo"}`}>
                    {p.stage === "review" ? <i className="cx-spin" /> : <i className="cx-dot" />}
                    Safety review by {reviewer}: doses, interactions, red flags
                  </div>
                )}
              </>
            )}
          </div>
          {p.mode === "slides" ? skeleton : p.deep && p.stage === "draft" && !p.deep.some((x) => x.id === "write") ? (
            <p className="cx-deep-note"><Telescope size={14} /> Deep Dive reads the research before it writes, so the report starts in a minute or two. You can leave this tab open and come back.</p>
          ) : (
            <LiveAnswer store={streamStore} writing={p.stage === "draft"} onGrow={followStream} placeholder={skeleton} />
          )}
          {p.stage === "review" && (
            <p className="cx-live-note"><ShieldCheck size={14} /> You're reading the draft. {reviewer} is checking it, and the reviewed answer will replace it.</p>
          )}
        </div>
      </div>
    );
  };

  const renderThread = () => (
    <div className="cx-thread" onClick={onThreadClick} {...citeHandlers}>
      {(() => {
        const cr = findCrew(active?.crewId, crewMine);
        return cr ? (
          <div className={`cx-crewbar tone-${cr.tone}`}>
            <CrewBadge c={cr} size={26} />
            <span><b>{cr.name}</b>{cr.tagline ? ` · ${cr.tagline}` : ""}</span>
            <button className={crewStyles[cr.id]?.mentor ? "on" : ""} aria-pressed={!!crewStyles[cr.id]?.mentor} onClick={() => { const on = !crewStyles[cr.id]?.mentor; setCrewStyles((mm) => setStyle(mm, cr.id, { ...mm[cr.id], mentor: on })); toast(on ? "Mentor mode on: it will ask before it tells" : "Mentor mode off"); }} data-crew="mentor"><GraduationCap size={13} /> Mentor</button>
            <button onClick={() => setHandoffFrom(cr)} data-crew="handoff"><ArrowRightLeft size={13} /> Hand off</button>
            <button onClick={() => startCrew(cr)}><Plus size={13} /> New chat</button>
          </div>
        ) : null;
      })()}
      {(() => {
        const c = active?.caseId ? cases.find((x) => x.id === active.caseId) : undefined;
        return c ? (
          <div className="cx-casebar">
            <ClipboardList size={15} />
            <span><b>{caseLabel(c)}</b>{c.complaint ? ` · ${c.complaint}` : ""}</span>
            <button onClick={() => openCases(c.id)}>Open case</button>
          </div>
        ) : null;
      })()}
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="cx-u">
            {m.reading ? <span className="cx-u-mode"><ScanSearch size={13} /> Read: {READINGS.find((r) => r.id === m.reading)?.label ?? m.reading}</span> : m.mode !== "general" && (() => { const I = MODE[m.mode].icon; return <span className="cx-u-mode"><I size={13} /> {MODE[m.mode].label}</span>; })()}
            {m.image && <img src={m.image} alt="Attached by you" className="cx-u-img" onClick={() => setLightbox(m.image || "")} />}
            {m.files?.length ? (
              <div className={`cx-u-files ${m.files.filter((f) => f.kind === "image" && f.data).length > 1 ? "multi" : ""}`}>
                {m.files.map((f) => (f.kind === "image" && f.data ? (
                  <img key={f.id} src={f.data} alt={f.name} className="cx-u-img" onClick={() => setLightbox(f.data || "")} />
                ) : (
                  <span
                    key={f.id}
                    className={`cx-u-file ${f.data ? "" : "gone"}`}
                    title={f.data ? describeAttachment(f) : `${describeAttachment(f)}. Not kept after reloading: attach it again to ask about it.`}
                  >
                    <span className={`cx-att-ic ${f.kind}`}><FileText size={16} /><em>{f.kind === "pdf" ? "PDF" : f.kind === "image" ? "IMG" : "TXT"}</em></span>
                    <span className="t">
                      <b>{f.name}</b>
                      <small>{f.kind === "pdf" ? (f.pages ? `PDF · ${f.pages} page${f.pages === 1 ? "" : "s"}` : "PDF") : f.kind === "image" ? "Image" : "Text"} · {formatSize(f.size)}</small>
                    </span>
                  </span>
                )))}
              </div>
            ) : null}
            {editing?.id === m.id ? (
              <div className="cx-u-edit">
                <textarea
                  autoFocus
                  value={editing.text}
                  onChange={(e) => setEditing({ id: m.id, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && prefs.enterToSend && !e.nativeEvent.isComposing) { e.preventDefault(); resend(m.id, editing.text); }
                    if (e.key === "Escape") { e.stopPropagation(); setEditing(null); }
                  }}
                  aria-label="Edit your message"
                />
                <div className="cx-u-edit-f">
                  <span>Sending replaces the answers after this message.</span>
                  <button className="cx-btn" onClick={() => setEditing(null)}>Cancel</button>
                  <button className="cx-btn primary" onClick={() => resend(m.id, editing.text)} disabled={!editing.text.trim() || !!pending}>Send</button>
                </div>
              </div>
            ) : (
              <>
                <div className="cx-u-b">{m.content}</div>
                {(!!m.privacy?.total || (!!m.lang && m.lang !== "English") || !!m.think || !!m.voice || !!m.amode || !!m.tone || !!m.mention) && (
                  <div className="cx-u-notes">
                    {m.privacy && m.privacy.total > 0 && (
                      <span className="cx-u-priv" title="Cadus's privacy guard replaced these details before your message was sent. The originals were not stored.">
                        <ShieldCheck size={13} /> {describeHits(m.privacy.hits)}
                      </span>
                    )}
                    {m.lang && m.lang !== "English" && <span className="cx-u-priv"><Languages size={13} /> Reply in {m.lang}</span>}
                    {m.think && <span className="cx-u-priv tag"><Lightbulb size={13} /> Think deeper</span>}
                    {m.voice && <span className="cx-u-priv tag"><AudioLines size={13} /> Voice</span>}
                    {m.amode && (() => { const am = AMODE[m.amode]; return <span className={`cx-u-priv tag ${m.amode === "deep" ? "deep" : ""}`}><am.icon size={13} /> {am.label}</span>; })()}
                    {m.tone && <span className="cx-u-priv tag">{TONES.find((t) => t.id === m.tone)?.label} tone</span>}
                    {m.mention && <span className="cx-u-priv tag at"><AtSign size={13} /> {m.mention.name}</span>}
                  </div>
                )}
                <div className="cx-u-acts">
                  <button className="cx-act cx-tip" data-tip={copied === m.id ? "Copied" : "Copy"} onClick={() => void copyText(m.id, m.content)} aria-label="Copy message">{copied === m.id ? <Check size={15} /> : <Copy size={15} />}</button>
                  <button className="cx-act cx-tip" data-tip="Edit" onClick={() => setEditing({ id: m.id, text: m.content })} disabled={!!pending} aria-label="Edit message"><Pencil size={15} /></button>
                </div>
              </>
            )}
          </div>
        ) : renderAnswer(m),
      )}
      {pending && pending.sid === activeId && renderPending(pending)}
    </div>
  );

  const sessionRow = (s: Session) => {
    if (renaming?.id === s.id && renaming.where === "side") {
      return (
        <div key={s.id} className="cx-row on">
          <input
            autoFocus
            value={renaming.text}
            onChange={(e) => setRenaming({ ...renaming, text: e.target.value })}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
            aria-label="Rename chat"
          />
        </div>
      );
    }
    const key = `row:${s.id}`;
    const busy = pending?.sid === s.id;
    const inProject = s.projectId ? projects.find((p) => p.id === s.projectId) : undefined;
    return (
      <div
        key={s.id}
        className={`cx-row ${s.id === activeId && view === "chat" ? "on" : ""}`}
        onClick={() => openSession(s.id)}
        title={inProject ? `${s.title} · ${inProject.name}` : s.title}
      >
        <span className={`cx-ring ${busy ? "busy" : ""}`} aria-hidden />
        <span className="cx-row-t">{s.title}</span>
        <button className={`cx-row-more ${pop === key ? "open" : ""}`} data-pop={key} onClick={(e) => openRowMenu(e, s.id)} aria-label="Chat options"><MoreHorizontal size={16} /></button>
      </div>
    );
  };

  const rowMenuSession = pop?.startsWith("row:") ? sessions.find((s) => `row:${s.id}` === pop) : undefined;

  const sessionMenuItems = (s: Session, where: "side" | "top") =>
    moveFor === s.id ? (
      <>
        <p className="cx-pop-gl">Move to project</p>
        {sortedProjects.map((p) => (
          <button key={p.id} className="cx-pop-i" onClick={() => moveToProject(s.id, p.id)} disabled={s.projectId === p.id}>
            <Folder size={16} /> <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            {s.projectId === p.id && <Check size={15} className="r" />}
          </button>
        ))}
        {s.projectId && <button className="cx-pop-i" onClick={() => moveToProject(s.id, undefined)}><FolderMinus size={16} /> Remove from project</button>}
        <div className="cx-pop-sep" />
        <button className="cx-pop-i" onClick={() => newProject(s.id)}><FolderPlus size={16} /> New project…</button>
        <button className="cx-pop-i" onClick={() => setMoveFor("")}><ArrowLeft size={16} /> Back</button>
      </>
    ) : dlFor === s.id ? (
      <>
        <p className="cx-pop-gl">Download this chat</p>
        <button className="cx-pop-i" onClick={() => exportSessionAs("word", s)}><FileDown size={16} /> Word document (.docx)</button>
        <button className="cx-pop-i" onClick={() => exportSession(s)}><Download size={16} /> PDF</button>
        <button className="cx-pop-i" onClick={() => exportSessionAs("md", s)}><FileText size={16} /> Markdown (.md)</button>
        <div className="cx-pop-sep" />
        <button className="cx-pop-i" onClick={() => setDlFor("")}><ArrowLeft size={16} /> Back</button>
      </>
    ) : confirmDelete === s.id ? (
      <>
        <p className="cx-pop-gl">Delete “{clip(s.title, 28)}”?</p>
        <button className="cx-pop-i danger" onClick={() => deleteSession(s.id)}><Trash2 size={16} /> Delete chat</button>
        <button className="cx-pop-i" onClick={() => setConfirmDelete("")}><X size={16} /> Cancel</button>
      </>
    ) : (
      <>
        <button className="cx-pop-i" onClick={() => togglePin(s.id)}>{s.pinned ? <PinOff size={16} /> : <Pin size={16} />} {s.pinned ? "Unpin" : "Pin"}</button>
        <button className="cx-pop-i" onClick={() => { setPop(null); setRenaming({ id: s.id, text: s.title, where }); }}><Pencil size={16} /> Rename</button>
        <button className="cx-pop-i" onClick={() => (projects.length ? setMoveFor(s.id) : newProject(s.id))}>
          <FolderInput size={16} /> {s.projectId ? "Change project" : "Add to project"} <ChevronRight size={15} className="r" />
        </button>
        <button className="cx-pop-i" onClick={() => setDlFor(s.id)}><Download size={16} /> Download <ChevronRight size={15} className="r" /></button>
        <button className="cx-pop-i" onClick={() => setArchived(s.id, !s.archived)}>
          {s.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />} {s.archived ? "Restore from archive" : "Archive"}
        </button>
        <div className="cx-pop-sep" />
        <button className="cx-pop-i danger" onClick={() => setConfirmDelete(s.id)}><Trash2 size={16} /> Delete</button>
      </>
    );

  const avatar = user
    ? <div className="cx-av">{(user.name || user.email || "U").slice(0, 1).toUpperCase()}</div>
    : <div className="cx-av guest"><Users size={15} /></div>;

  // Without an account, the sign-in page (shared and trust pages stay open).
  useEffect(() => { if (gated) window.location.replace(`${signInHref}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); }, [gated]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!gated && setupState !== "done") {
    return (
      <div className={`cx ${dark ? "cx-dark" : "cx-light"} ans-sans`} data-look={prefs.look}>
        <style>{CADUS_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + PROFILE_SETUP_CSS}</style>
        {setupState === "checking" ? (
          <div className="cx-gate"><div className="cx-gate-in"><CadusMark size={36} /><p>Opening your profile…</p></div></div>
        ) : (
          <ProfileSetup initial={profile} accountName={user?.name ?? ""} accountEmail={user?.email || user?.phone || ""} onDone={finishSetup} saving={setupSaving} serverNote={serverNote} />
        )}
      </div>
    );
  }
  if (gated) {
    return (
      <div className={`cx cx-gate ${dark ? "cx-dark" : "cx-light"}`} data-look={prefs.look}>
        <style>{CADUS_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS}</style>
        <div className="cx-gate-in"><CadusMark size={36} /><p>Taking you to sign in…</p><a className="cx-btn primary" href={signInHref}>Sign in to Cadus <ArrowRight size={14} /></a></div>
      </div>
    );
  }

  return (
    <div
      className={`cx ${dark ? "cx-dark" : "cx-light"} ${serif ? "ans-serif" : "ans-sans"} ${collapsed && isDesktop ? "is-collapsed" : ""} ${canvasDoc || sourcesFor ? "has-canvas" : ""} ${prefs.density === "compact" ? "is-compact" : ""}`}
      data-look={prefs.look}
      style={{ ["--acc" as string]: dark ? accent.dark : accent.light, ["--fs" as string]: `${fontSize}px`, ["--fs-u" as string]: `${sansSize}px` }}
      {...dropHandlers}
    >
      <style>{CADUS_CSS + CADUS_TOOLS_CSS + CADUS_CHAT_CSS + CADUS_PRO_CSS + CADUS_REF_CSS + CADUS_WS_CSS + CADUS_CLINIC_CSS + CADUS_LOOKS_CSS + CADUS_PLUS_CSS + CADUS_LABS_CSS + CADUS_CREW_CSS + CADUS_STUDIO_CSS + CADUS_TODAY_CSS + CADUS_WARD_CSS + CADUS_BEDSIDE_CSS + CADUS_CREWPLUS_CSS + CADUS_VOICE_CSS + CADUS_CLINIC20_CSS + CADUS_CLINIC21_CSS + CADUS_CLINIC22_CSS + CADUS_CLINIC23_CSS + CADUS_CLINIC24_CSS + CADUS_CLINIC25_CSS + CADUS_CLINIC26_CSS + CADUS_CLINIC27_CSS + CADUS_CLINIC28_CSS + CADUS_CLINIC29_CSS + CADUS_CLINIC30_CSS + CADUS_CLINIC31_CSS + CADUS_CLINIC32_CSS + CADUS_CLINIC34_CSS + CADUS_CLINIC35_CSS + CADUS_CLINIC36_CSS + CADUS_CLINIC37_CSS + CADUS_CLINIC38_CSS + CADUS_CLINIC39_CSS + CADUS_CLINIC40_CSS}</style>

      {/* ============================================== sidebar */}
      <div className={`cx-scrim ${sidebarOpen ? "on" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`cx-side ${sidebarOpen ? "open" : ""}`} aria-label="Sidebar">
        <div className="cx-side-head">
          <button
            className="cx-brand"
            title={collapsed && isDesktop ? "Expand sidebar" : "Cadus home"}
            onClick={() => (collapsed && isDesktop ? setCollapsed(false) : newChat())}
            aria-label="Cadus home"
          >
            <CadusMark size={28} />
            <span className="cx-wm">Cadus<small>Clinical AI by Aethex</small></span>
          </button>
          <button className="cx-ib cx-collapse cx-dt" title="Collapse sidebar" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar"><PanelLeftClose size={18} /></button>
          <button className="cx-ib cx-m" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <nav className="cx-nav" aria-label="Cadus">
          <button className="cx-nav-i cx-new" onClick={() => newChat()} title={`New chat (${MOD} ⇧ O)`}>
            <span className="cx-new-ic"><Plus size={15} strokeWidth={2.6} /></span><span className="cx-nav-l">New chat</span><kbd>{MOD} ⇧ O</kbd>
          </button>
          {([
            ["cases", ClipboardList, "Cases", activeCases, () => openCases()],
            ["practice", GraduationCap, "Learn", 0, openPractice],
            ["tools", LayoutGrid, "Tools", 0, () => { setView("tools"); setSidebarOpen(false); }],
            ["crew", Bot, "Crew", 0, openCrew],
            ["library", Library, "Library", library.length, () => { setView("library"); setSidebarOpen(false); }],
          ] as [View, LucideIcon, string, number, () => void][]).map(([id, Icon, label, count, go]) => (
            <button
              key={id}
              data-tour={id}
              className={`cx-nav-i ${view === id || (id === "tools" && TOOL_VIEWS.has(view)) ? "on" : ""}`}
              onClick={go}
              title={label}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={17} /><span className="cx-nav-l">{label}</span>{count > 0 && <em>{count}</em>}
            </button>
          ))}
          <button className={`cx-nav-i ${moreOpen ? "open" : ""}`} onClick={() => setMoreOpen((o) => !o)} title="More" aria-expanded={moreOpen}>
            <MoreHorizontal size={17} /><span className="cx-nav-l">More</span><ChevronDown size={14} className="cx-chev" />
          </button>
          {moreOpen && (
            <div className="cx-more">
              <label className="cx-more-find"><Search size={14} /><input value={moreQ} onChange={(e) => setMoreQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setMoreQ(""); if (e.key === "Enter" && moreFound[0]) { setMoreQ(""); moreFound[0].go(); } }} placeholder={`Find a tool (${moreGroups.reduce((n, g) => n + g.items.length, 0)})`} aria-label="Find a tool" />{moreQ && <button className="cx-more-clear" onClick={() => setMoreQ("")} aria-label="Clear"><X size={13} /></button>}</label>
              {moreQ.trim() ? (
                moreFound.length ? <div className="cx-grp-b found">{moreFound.map(moreItemButton)}</div> : <p className="cx-more-none">No tool matches "{moreQ.trim()}"</p>
              ) : moreGroups.map((g) => {
                const open = openGroups.includes(g.id) || (tourOpen && g.items.some((i) => i.tour)); // the tour points at items inside these groups
                return (
                  <div key={g.id} className={`cx-grp ${open ? "open" : ""}`} data-group={g.id}>
                    <button className="cx-grp-h" onClick={() => setOpenGroups((l) => (l.includes(g.id) ? [] : [g.id]))} aria-expanded={open} title={g.label}><g.icon size={16} /><span className="cx-nav-l">{g.label}</span><em>{g.items.length}</em><ChevronDown size={14} className="cx-chev" /></button>
                    {open && <div className="cx-grp-b">{g.items.map(moreItemButton)}</div>}
                  </div>
                );
              })}
              <p className="cx-more-gl">Trust</p>
              <button className={`cx-nav-i ${view === "safety" ? "on" : ""}`} onClick={() => { setView("safety"); setSidebarOpen(false); }} title="Clinical safety"><ShieldCheck size={16} /><span className="cx-nav-l">Clinical safety</span></button>
              <button className={`cx-nav-i ${view === "history" ? "on" : ""}`} onClick={() => { setView("history"); setSidebarOpen(false); }} title="Answer history"><History size={16} /><span className="cx-nav-l">Answer history</span></button>
              <button className={`cx-nav-i ${view === "privacy" ? "on" : ""}`} onClick={() => { setView("privacy"); setSidebarOpen(false); }} title="Privacy centre"><EyeOff size={16} /><span className="cx-nav-l">Privacy centre</span></button>
              <p className="cx-more-gl">App</p>
              <a className="cx-nav-i" href={plansHref} title="Plans and pricing"><Sparkles size={16} /><span className="cx-nav-l">Plans</span><em className="cx-nav-plan">{PLAN_BY_ID[plan].name}</em></a>
              <button className="cx-nav-i" onClick={() => openSettings("personal")} title="Customize"><Palette size={16} /><span className="cx-nav-l">Customize</span></button>
              <button className="cx-nav-i" onClick={openPalette} title="Search"><Search size={16} /><span className="cx-nav-l">Search</span><kbd>{MOD} K</kbd></button>
              <button className="cx-nav-i" onClick={() => openSettings("shortcuts")} title="Keyboard shortcuts"><Keyboard size={16} /><span className="cx-nav-l">Keyboard shortcuts</span></button>
              <button className="cx-nav-i" onClick={startTour} title="Take the tour"><Compass size={16} /><span className="cx-nav-l">Take the tour</span></button>
              <button className="cx-nav-i" onClick={() => openSettings("about")} title="Help and about"><CircleQuestionMark size={16} /><span className="cx-nav-l">Help and about</span></button>
              {!IN_DESKTOP_APP && <a className="cx-nav-i" href="/downloads" title="Cadus for Windows and Linux"><Download size={16} /><span className="cx-nav-l">Desktop app</span></a>}
            </div>
          )}
          {collapsed && isDesktop && (
            <button className="cx-nav-i" title="Expand sidebar" onClick={() => setCollapsed(false)} aria-label="Expand sidebar"><PanelLeftOpen size={17} /></button>
          )}
        </nav>

        <div className="cx-hist">
          {pinned.length > 0 && (
            <div className="cx-sec">
              <p className="cx-gl"><span>Pinned</span></p>
              {pinned.map(sessionRow)}
            </div>
          )}
          <div className="cx-sec">
            <div className="cx-gl">
              <span>Chats</span>
              <button
                className={`cx-gl-b ${chatSearch !== null ? "on" : ""}`}
                onClick={() => setChatSearch((q) => (q === null ? "" : null))}
                aria-label="Search chats"
                title="Search chats"
              >
                <Search size={14} />
              </button>
              <div className="cx-rel" data-pop="filter">
                <button
                  className={`cx-gl-b ${chatFilter !== "all" ? "on" : ""} ${pop === "filter" ? "open" : ""}`}
                  onClick={() => togglePop("filter")}
                  aria-label="Filter chats"
                  title="Filter chats"
                  aria-haspopup="menu"
                  aria-expanded={pop === "filter"}
                >
                  <ListFilter size={14} />
                </button>
                {pop === "filter" && (
                  <div className="cx-pop cx-filter-menu" role="menu">
                    <p className="cx-pop-gl">Show chats</p>
                    {TOOL_TABS.map((t) => (
                      <button key={t.id} className="cx-pop-i" onClick={() => { setChatFilter(t.id); setPop(null); }}>
                        {t.label === "All" ? "All chats" : t.label}
                        {chatFilter === t.id && <Check size={15} className="r" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {chatSearch !== null && (
              <label className="cx-side-search">
                <Search size={14} />
                <input
                  autoFocus
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setChatSearch(null); } }}
                  placeholder="Search chat titles"
                  aria-label="Search chat titles"
                />
                <button onClick={() => setChatSearch(null)} aria-label="Close search"><X size={13} /></button>
              </label>
            )}
            {chatFilter !== "all" && (
              <div className="cx-filter-chip">
                <span>{TOOL_TABS.find((t) => t.id === chatFilter)?.label} chats</span>
                <button onClick={() => setChatFilter("all")}>Show all</button>
              </div>
            )}
            {listed.length === 0 ? (
              <div className="cx-hist-empty">Your chats will appear here. History is saved only in this browser.</div>
            ) : chatList.length === 0 ? (
              <p className="cx-hist-none">{pinned.length === listed.length && !chatQuery && chatFilter === "all" ? "All your chats are pinned." : "No chats match."}</p>
            ) : (
              chatList.map(sessionRow)
            )}
            {archivedList.length > 0 && !chatQuery && chatFilter === "all" && (
              <button className="cx-arch-link" onClick={() => { setArchivedOpen(true); openSettings("data"); }}>
                <Archive size={14} /> Archived chats <em>{archivedList.length}</em>
              </button>
            )}
          </div>
        </div>

        <div className="cx-side-foot">
          <div className="cx-acct-wrap" data-pop="acct">
            <button className={`cx-acct ${pop === "acct" ? "open" : ""}`} onClick={() => togglePop("acct")} aria-haspopup="menu" aria-expanded={pop === "acct"} title="Account">
              {avatar}
              <div className="cx-acct-t">
                <b>{user ? user.name || "Aethex member" : "Guest"}</b>
                <small>{user ? (profile?.specialty ? `${profile.specialty}${badge ? " · Registered" : ""}` : `${PLAN_BY_ID[plan].name} plan`) : "Not signed in"}</small>
              </div>
              <ChevronsUpDown size={15} />
            </button>
            {pop === "acct" && (
              <div className="cx-pop cx-acct-menu" role="menu">
                <div className="cx-acct-head">
                  {avatar}
                  <div style={{ minWidth: 0 }}><b>{user ? user.name || "Aethex member" : "Guest"}</b><small>{user?.email || "Sign in to use your Aethex account"}</small>{badge && <small className="cx-acct-badge"><ShieldCheck size={12} /> {badge} · self-declared</small>}</div>
                  <a className="cx-plan" style={{ marginLeft: "auto" }} href={plansHref} title="Plans">{PLAN_BY_ID[plan].name}</a>
                </div>
                <div className="cx-usage">
                  <div className="cx-usage-top"><span>Questions today</span><b>{limits.questionsPerDay === Infinity ? `${usage.count} · Unlimited` : `${usage.count} of ${limits.questionsPerDay}`}</b></div>
                  {limits.questionsPerDay !== Infinity && <div className="cx-usage-bar"><i style={{ width: `${Math.min(100, (usage.count / limits.questionsPerDay) * 100)}%` }} /></div>}
                  {plan !== "enterprise" && <a className="cx-usage-up" href={plansHref}><Sparkles size={13} /> {plan === "starter" ? "See plans" : "Change plan"}</a>}
                </div>
                <div className="cx-theme-seg">
                  {(["light", "dark", "system"] as const).map((t) => (
                    <button key={t} className={prefs.theme === t ? "on" : ""} onClick={() => setPrefs((p) => ({ ...p, theme: t }))}>
                      {t === "light" ? <Sun size={13} /> : t === "dark" ? <Moon size={13} /> : <Laptop size={13} />}{t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}
                    </button>
                  ))}
                </div>
                <button className="cx-pop-i" onClick={() => openSettings()}><Settings size={16} /> Settings</button>
                <button className="cx-pop-i" onClick={() => openSettings("personal")}><Palette size={16} /> Customize</button>
                <button className="cx-pop-i" onClick={() => openSettings("about")}><CircleQuestionMark size={16} /> Help and about</button>
                <div className="cx-pop-sep" />
                <a className="cx-pop-i" href={homeHref}><ArrowLeft size={16} /> Back to aethex.in</a>
                {user ? (
                  <button className="cx-pop-i" onClick={() => { setPop(null); logout(); toast("Signed out"); }}><LogOut size={16} /> Sign out</button>
                ) : (
                  <a className="cx-pop-i" href={signInHref}><LogIn size={16} /> Sign in</a>
                )}
              </div>
            )}
          </div>
          <div className="cx-apps-wrap" data-pop="apps">
            <button className={`cx-ib ${pop === "apps" ? "open" : ""}`} onClick={() => togglePop("apps")} aria-label="Aethex apps" title="Aethex apps" aria-haspopup="menu" aria-expanded={pop === "apps"}>
              <Grip size={18} />
            </button>
            {pop === "apps" && (
              <div className="cx-pop cx-apps-menu" role="menu">
                <p className="cx-pop-gl">Aethex apps</p>
                <div className="cx-apps-grid">
                  {APPS.map((a) => (
                    <a key={a.path} className="cx-app" href={appHref(a.path)} role="menuitem">
                      <span className="cx-app-ic"><a.icon size={19} /></span>
                      <span>{a.label}</span>
                    </a>
                  ))}
                </div>
                <a className="cx-apps-foot" href={homeHref}><CadusMark size={14} /> <span>Cadus is part of Aethex</span> <ArrowUpRight size={13} style={{ marginLeft: "auto" }} /></a>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================== main */}
      <main className="cx-main" style={wallpaper ? { backgroundImage: wallpaper.image, backgroundSize: wallpaper.size, backgroundAttachment: wallpaper.attachment, backgroundPosition: wallpaper.position } : undefined}>
        {!online && (
          <div className="cx-offline" role="status">
            <WifiOff size={14} /> <b>You're offline.</b> <span>Calculators, your ward list, cases and saved answers still work. Questions need a connection.</span>
          </div>
        )}
        <header className={`cx-top ${view !== "chat" || messages.length ? "lined" : ""}`}>
          <button className="cx-ib cx-m" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="cx-picker-wrap" data-pop="picker">
            <button className={`cx-picker ${pop === "picker" ? "open" : ""}`} onClick={() => togglePop("picker")} aria-haspopup="menu" aria-expanded={pop === "picker"}>
              Cadus <span>{modelDef.short}</span> <ChevronDown size={15} />
            </button>
            {pop === "picker" && (
              <div className="cx-pop cx-picker-menu" role="menu">
                <p className="cx-pop-gl">Model</p>
                {MODELS.map((md) => (
                  <button key={md.id} className={`cx-pick ${prefs.model === md.id ? "on" : ""}`} onClick={() => { if (md.id === "magnus" && !limits.magnus) { setPop(null); setUpgrade({ reason: `${md.name} as the drafting model is part of Professional and above.`, feature: "magnus" }); return; } setPrefs((p) => ({ ...p, model: md.id })); setPop(null); }}>
                    <span className="cx-pick-ic"><md.icon size={16} /></span>
                    <span><b>{md.name}</b><small>{md.desc}</small></span>
                    {prefs.model === md.id && <Check size={16} className="ck" />}
                  </button>
                ))}
                <div className="cx-pop-sep" />
                <p className="cx-pop-gl">Response style</p>
                {STYLES.map((s) => (
                  <button key={s.id} className={`cx-pick ${prefs.style === s.id ? "on" : ""}`} onClick={() => { setPrefs((p) => ({ ...p, style: s.id })); setPop(null); }}>
                    <span className="cx-pick-ic"><s.icon size={16} /></span>
                    <span><b>{s.label}</b><small>{s.desc}</small></span>
                    {prefs.style === s.id && <Check size={16} className="ck" />}
                  </button>
                ))}
                <div className="cx-pick-foot"><ShieldCheck size={13} /> {prefs.safetyReview ? `Clinical answers are safety-reviewed by ${MODEL_DEF.magnus.short}` : "Safety review is off"}</div>
              </div>
            )}
          </div>

          <div className="cx-top-mid">
            {view === "chat" && active && messages.length > 0 && (
              <div className="cx-crumbs">
                {activeProject && (
                  <>
                    <button className="cx-crumb" onClick={() => openProject(activeProject.id)} title={`Open ${activeProject.name}`}>
                      <Folder size={14} /><span>{activeProject.name}</span>
                    </button>
                    <span className="cx-crumb-sep" aria-hidden>/</span>
                  </>
                )}
                {active.temp ? (
                  <span className="cx-title-btn static" title="Not saved to your history"><MessageSquareDashed size={14} /> <span>Temporary chat</span></span>
                ) : renaming?.id === active.id && renaming.where === "top" ? (
                  <input
                    className="cx-title-in"
                    autoFocus
                    value={renaming.text}
                    onChange={(e) => setRenaming({ ...renaming, text: e.target.value })}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenaming(null); }}
                    aria-label="Rename chat"
                  />
                ) : (
                  <div className="cx-title-wrap" data-pop="title">
                    <button className={`cx-title-btn ${pop === "title" ? "open" : ""}`} onClick={() => { setConfirmDelete(""); setMoveFor(""); setDlFor(""); togglePop("title"); }}>
                      <span>{active.title}</span><ChevronDown size={14} />
                    </button>
                    {pop === "title" && <div className="cx-pop cx-title-menu" role="menu">{sessionMenuItems(active, "top")}</div>}
                  </div>
                )}
              </div>
            )}
            {view !== "chat" && (() => {
              const [Icon, label]: [LucideIcon, string] =
                view === "tools" ? [LayoutGrid, "Tools"]
                : view === "crew" ? [Bot, "Cadus Crew"]
                : view === "huddle" ? [Users2, "Crew Huddle"]
                : view === "second" ? [Scale, "Second Opinion"]
                : view === "debate" ? [Swords, "Crew Debate"]
                : view === "playbooks" ? [Workflow, "Crew Playbooks"]
                : view === "calculators" ? [Calculator, "Calculators"]
                : view === "practice" ? [GraduationCap, "Learn"]
                : view === "library" ? [Library, "Library"]
                : view === "decks" ? [Presentation, "Decks"]
                : view === "research" ? [Microscope, "Research"]
                : view === "safety" ? [ShieldCheck, "Clinical safety"]
                : view === "history" ? [History, "Answer history"]
                : view === "privacy" ? [EyeOff, "Privacy centre"]
                : view === "ward" ? [BedDouble, "Ward round"]
                : view === "cases" ? [ClipboardList, "Patient cases"]
                : view === "drugs" ? [Pill, "Drugs"]
                : view === "scribe" ? [Mic, "Scribe"]
                : view === "emergency" ? [Siren, "Emergencies"]
                : view === "paeds" ? [Baby, "Paediatrics and obstetrics"]
                : view === "leaflets" ? [FileText, "Patient leaflets"]
                : view === "simulator" ? [HeartPulse, "Case Simulator"]
                : view === "rxcheck" ? [ShieldPlus, "Rx Safety Check"]
                : view === "watch" ? [BellRing, "Guideline Watch"]
                : view === "explain" ? [FileScan, "Report Explainer"]
                : view === "translate" ? [Languages, "Consult Translator"]
                : view === "pathways" ? [GitFork, "Clinical Pathways"]
                : view === "flashcards" ? [Layers, "Flashcards"]
                : view === "compare" ? [History, "Compare over time"]
                : view === "medrec" ? [Pill, "Med Reconciliation"]
                : view === "present" ? [Presentation, "Presentation Coach"]
                : view === "today" ? [CalendarDays, "Today"]
                : view === "discharge" ? [FileOutput, "Discharge Summary"]
                : view === "handover" ? [ArrowRightLeft, "Shift Handover"]
                : view === "ddx" ? [Waypoints, "Differential Builder"]
                : view === "studyplan" ? [CalendarCheck, "Study Planner"]
                : view === "podcasts" ? [Headphones, "Revision Podcasts"]
                : view === "ecg" ? [Activity, "ECG Reader"]
                : view === "abx" ? [Bug, "Antibiotic Guide"]
                : view === "procedure" ? [ListChecks, "Procedure Guide"]
                : view === "poison" ? [FlaskRound, "Poisoning & Snakebite"]
                : view === "infusions" ? [Syringe, "Infusions"]
                : view === "convert" ? [Scale, "Dose Converter"]
                : view === "abg" ? [Wind, "ABG Interpreter"]
                : view === "logbook" ? [BookCheck, "PG Logbook"]
                : view === "followups" ? [CalendarClock, "Follow-ups"]
                : view === "audiolib" ? [FileAudio, "Patient Audio Library"]
                : view === "rxwrite" ? [FilePen, "Prescription Writer"]
                : view === "labtrend" ? [ChartLine, "Lab Trends"]
                : view === "daily" ? [CalendarHeart, "Daily Clinical Case"]
                : view === "letters" ? [ScrollText, "Letters & Certificates"]
                : view === "adr" ? [ShieldAlert, "ADR Report (PvPI)"]
                : view === "mccd" ? [FileSignature, "Cause of Death (MCCD)"]
                : view === "mnemonics" ? [Brain, "Mnemonic Maker"]
                : view === "generics" ? [PillBottle, "Generic Finder"]
                : view === "opd" ? [ListOrdered, "OPD Queue"]
                : view === "imagequiz" ? [Images, "Clinical Image Quiz"]
                : view === "dosecard" ? [Weight, "Dose Card by Weight"]
                : view === "oncall" ? [PhoneCall, "On-call Helper"]
                : view === "journal" ? [BookOpenText, "Journal Club"]
                : view === "stats" ? [Sigma, "Statistics Test Chooser"]
                : view === "roster" ? [CalendarRange, "Duty Roster"]
                : view === "records" ? [FolderHeart, "Patient Records"]
                : view === "voiceround" ? [AudioWaveform, "Ward Rounds by Voice"]
                : view === "revnotes" ? [NotebookPen, "Revision Notes"]
                : view === "analytics" ? [BarChart3, "Clinic Analytics"]
                : view === "preop" ? [ClipboardPlus, "Pre-op Assessment"]
                : view === "messages" ? [MessageSquareText, "Patient Messages"]
                : view === "preglact" ? [Baby, "Pregnancy & Breastfeeding"]
                : view === "pillchart" ? [Sun, "Pill Chart"]
                : view === "vaccines" ? [Syringe, "Vaccination Scheduler"]
                : view === "diet" ? [Salad, "Diet Chart Maker"]
                : view === "icd" ? [FileCode2, "ICD-10 Coder"]
                : view === "consent" ? [FileSignature, "Consent Form Writer"]
                : view === "insulin" ? [Pipette, "Insulin Planner"]
                : view === "transfusion" ? [Droplet, "Blood Transfusion"]
                : view === "mlc" ? [Gavel, "MLC Injury Report"]
                : view === "tb" ? [Microscope, "TB Treatment (NTEP)"]
                : view === "antenatal" ? [Heart, "Antenatal Care Tracker"]
                : view === "ventilator" ? [Fan, "Ventilator Helper"]
                : view === "teleconsult" ? [Video, "Teleconsultation Note"]
                : view === "bills" ? [ReceiptIndianRupee, "Clinic Bills & Receipts"]
                : view === "bite" ? [Dog, "Animal Bite (Rabies PEP)"]
                : view === "needlestick" ? [Bandage, "Needle-stick Injury"]
                : view === "imnci" ? [Thermometer, "IMNCI Sick Child"]
                : view === "cme" ? [Award, "CME Credits"]
                : view === "appointments" ? [CalendarPlus, "Appointments"]
                : view === "stock" ? [Warehouse, "Pharmacy Stock & Expiry"]
                : view === "screening" ? [HeartHandshake, "Mental Health Screening"]
                : view === "kidney" ? [Bean, "Kidney Dose Adjuster"]
                : view === "sam" ? [Ruler, "Malnutrition (SAM) Helper"]
                : view === "contacts" ? [ContactRound, "Referral Contacts"]
                : view === "accounts" ? [Wallet, "Clinic Accounts"]
                : view === "thyroid" ? [Gauge, "Thyroid Dose Helper"]
                : view === "backup" ? [DatabaseBackup, "Backup & Restore"]
                : view === "ncd" ? [TrendingUp, "BP & Sugar Protocols"]
                : view === "anaemia" ? [Droplets, "Anaemia & Iron"]
                : view === "dengue" ? [BugOff, "Dengue Helper"]
                : view === "electrolytes" ? [FlaskConical, "Electrolyte Replacement"]
                : view === "obsemergency" ? [Ambulance, "Obstetric Emergencies"]
                : view === "infection" ? [Biohazard, "Infection Control & Waste"]
                : view === "asthma" ? [Wind, "Asthma & COPD Plans"]
                : view === "milestones" ? [PersonStanding, "Developmental Milestones"]
                : view === "contraception" ? [Ribbon, "Contraception Advisor"]
                : view === "palliative" ? [HandHeart, "Palliative Care Helper"]
                : view === "imaging" ? [ScanLine, "Imaging Decision Rules"]
                : view === "ivfluids" ? [Droplet, "IV Fluids Planner"]
                : view === "sickday" ? [ThermometerSun, "Sick-Day Rules"]
                : view === "labranges" ? [TestTubes, "Lab Reference Ranges"]
                : view === "burns" ? [Flame, "Burns Helper"]
                : view === "jaundice" ? [Lightbulb, "Neonatal Jaundice"]
                : view === "stroke" ? [Brain, "Stroke & Thrombolysis"]
                : view === "bundles" ? [HeartPulse, "Sepsis & DKA Bundles"]
                : view === "alcohol" ? [Wine, "Alcohol Withdrawal"]
                : view === "dfoot" ? [Footprints, "Diabetic Foot"]
                : view === "heat" ? [Sun, "Heat Illness"]
                : view === "wound" ? [Bandage, "Wound & Suture Care"]
                : view === "anticoag" ? [Syringe, "Warfarin & Anticoagulation"]
                : view === "fevers" ? [Bug, "Tropical Fevers"]
                : view === "elderly" ? [Accessibility, "Elderly Care"]
                : view === "quitsmoking" ? [CigaretteOff, "Quit Smoking Helper"]
                : view === "croup" ? [AirVent, "Croup & Child Asthma"]
                : view === "rheumatic" ? [HeartCrack, "Rheumatic Fever"]
                : view === "weight" ? [Scale, "Weight Management"]
                : view === "hypo" ? [Candy, "Hypoglycaemia"]
                : view === "gdm" ? [Droplets, "Gestational Diabetes"]
                : view === "infantfeed" ? [Milk, "Infant Feeding"]
                : view === "antidep" ? [Repeat, "Antidepressant Switcher"]
                : view === "eyeent" ? [Eye, "Eye & ENT Triage"]
                : view === "vte" ? [ShieldPlus, "VTE Prophylaxis"]
                : view === "headache" ? [BrainCircuit, "Headache & Migraine"]
                : view === "skin" ? [Hand, "Skin Infections"]
                : view === "gout" ? [Bone, "Gout & Uric Acid"]
                : view === "pnuti" ? [Pill, "Pneumonia & UTI Antibiotics"]
                : view === "ckd" ? [Bean, "CKD Care"]
                : view === "preterm" ? [Hourglass, "Preterm Labour"]
                : view === "epilepsy" ? [Zap, "Epilepsy & First Seizure"]
                : view === "childfever" ? [Thermometer, "Fever in Under-5s"]
                : view === "cirrhosis" ? [FlaskRound, "Cirrhosis & Ascites"]
                : view === "dementia" ? [BrainCog, "Dementia & Memory"]
                : view === "htnemergency" ? [Gauge, "Hypertensive Emergency"]
                : view === "ugib" ? [Activity, "Upper GI Bleed & H. pylori"]
                : view === "aki" ? [FlaskConical, "Acute Kidney Injury"]
                : view === "hepbc" ? [ShieldCheck, "Hepatitis B & C"]
                : view === "nrp" ? [Baby, "Newborn Resuscitation"]
                : view === "pain" ? [PillBottle, "Pain Relief Planner"]
                : view === "bone" ? [Bone, "Osteoporosis & Bone Health"]
                : view === "hrt" ? [Flower2, "Menopause & HRT"]
                : view === "syncope" ? [HeartPulse, "Syncope"]
                : view === "hf" ? [HeartPulse, "Heart Failure GDMT"]
                : view === "af" ? [Activity, "Atrial Fibrillation"]
                : view === "lipids" ? [Droplets, "Lipids & CV Risk"]
                : view === "pedvt" ? [Waves, "PE & DVT"]
                : view === "hiv" ? [Ribbon, "HIV Care"]
                : view === "preeclampsia" ? [Baby, "Pre-eclampsia"]
                : view === "sleep" ? [Moon, "Insomnia & Sleep"]
                : view === "urticaria" ? [CircleDot, "Urticaria & Angioedema"]
                : view === "anaphylaxis" ? [Siren, "Anaphylaxis & Allergy Plan"]
                : view === "trauma" ? [Ambulance, "Trauma Primary Survey"]
                : view === "tox" ? [FlaskConical, "Toxicology"]
                : view === "ptx" ? [Wind, "Pneumothorax & Chest Drain"]
                : view === "fluids" ? [TestTube, "Body Fluid Analysis"]
                : view === "steroid" ? [Syringe, "Adrenal Crisis & Steroid Cover"]
                : view === "refeed" ? [Utensils, "Refeeding & Nutrition"]
                : view === "backpain" ? [Bone, "Back Pain & Cauda Equina"]
                : view === "acs" ? [HeartPulse, "Chest Pain & ACS"]
                : view === "childfluids" ? [GlassWater, "Child Fluids & Dehydration"]
                : view === "agitation" ? [ShieldAlert, "Agitation & Rapid Tranquillisation"]
                : view === "suicide" ? [LifeBuoy, "Suicide Risk & Safety Plan"]
                : view === "headinjury" ? [Brain, "Head Injury & CT Rules"]
                : view === "abdomen" ? [Stethoscope, "Acute Abdomen & Appendicitis"]
                : view === "fneutro" ? [ShieldPlus, "Febrile Neutropenia"]
                : view === "meningitis" ? [Bug, "Meningitis & Encephalitis"]
                : view === "statusepi" ? [Zap, "Status Epilepticus"]
                : view === "sodium" ? [FlaskConical, "Hyponatraemia & Sodium"]
                : view === "attack" ? [Wind, "Asthma & COPD Attack"]
                : view === "bridging" ? [ClipboardCheck, "Pre-op Risk & Anticoagulant Bridging"]
                : view === "oncoemerg" ? [Ribbon, "Oncology Emergencies"]
                : view === "spirometry" ? [Gauge, "Spirometry Interpreter"]
                : view === "thyroidstorm" ? [Thermometer, "Thyroid Storm & Myxoedema Coma"]
                : view === "sickle" ? [Droplets, "Sickle Cell & Thalassaemia"]
                : view === "hyperk" ? [HeartPulse, "Hyperkalaemia & ECG"]
                : view === "pancreatitis" ? [Stethoscope, "Acute Pancreatitis Plan"]
                : view === "paedsepsis" ? [Baby, "Paediatric Sepsis & Shock"]
                : view === "airway" ? [Wind, "Upper Airway & Stridor"]
                : view === "rhabdo" ? [Bone, "Rhabdomyolysis & CK"]
                : view === "hypothermia" ? [Snowflake, "Hypothermia & Drowning"]
                : view === "paeddka" ? [Droplet, "Paediatric DKA"]
                : view === "retention" ? [Droplets, "Acute Urinary Retention"]
                : view === "preghtn" ? [Baby, "Hypertension in Pregnancy & Postpartum"]
                : view === "stones" ? [Droplets, "Kidney Stones & Colic"]
                : view === "paedabx" ? [Baby, "Children's Antibiotics by Weight"]
                : view === "opioid" ? [Syringe, "Opioid Conversion & Palliative Infusions"]
                : view === "cellulitis" ? [Bandage, "Cellulitis & Necrotising Fasciitis"]
                : view === "kawasaki" ? [Baby, "Kawasaki Disease"]
                : view === "endocarditis" ? [HeartPulse, "Infective Endocarditis"]
                : view === "bell" ? [Smile, "Bell's Palsy & Facial Weakness"]
                : view === "pph" ? [Droplet, "Postpartum Haemorrhage"]
                : view === "neosepsis" ? [Baby, "Neonatal Sepsis & Antibiotics"]
                : view === "renalabx" ? [FlaskConical, "Antibiotic Renal Dosing"]
                : view === "braindeath" ? [HeartHandshake, "Brain-stem Death & Organ Donation"]
                : view === "septicjoint" ? [Bone, "Septic Arthritis & Hot Joint"]
                : view === "neohypo" ? [Baby, "Neonatal Hypoglycaemia"]
                : view === "altitude" ? [Mountain, "Altitude Illness"]
                : view === "serotonin" ? [Thermometer, "Serotonin Syndrome vs NMS"]
                : view === "crewworkspaces" ? [Briefcase, "Crew Workspaces"]
                : view === "crewdigest" ? [CalendarRange, "Crew Digest"]
                : view === "paedasthma" ? [Baby, "Acute Asthma in Children"]
                : view === "dkahhs" ? [Droplet, "DKA & HHS Adult Timer"]
                : view === "ansteroid" ? [Baby, "Antenatal Steroids & Tocolysis"]
                : view === "ironb12" ? [Pill, "Iron, B12 & Folate Replacement"]
                : view === "tdm" ? [FlaskConical, "Therapeutic Drug Levels"]
                : view === "contrast" ? [ScanLine, "Contrast Safety"]
                : view === "pressure" ? [Bed, "Pressure Injuries"]
                : view === "hyperemesis" ? [Baby, "Hyperemesis Gravidarum"]
                : view === "crewschedules" ? [AlarmClock, "Assistant Schedules"]
                : view === "crewcompare" ? [Columns3, "Assistant Compare"]
                : view === "crewvoice" ? [Mic, "Voice Chat"]
                : view === "crewtemplates" ? [LibraryBig, "Prompt Templates"]
                : view === "crewtimeline" ? [ScrollText, "Crew Timeline"]
                : view === "crewnotes" ? [StickyNote, "Crew Notes & Flashcards"]
                : view === "checkins" ? [BellRing, "Crew Check-ins"]
                : view === "crewstats" ? [Award, "Crew Stats & Badges"]
                : view === "rooms" ? [MessagesSquare, "Crew Chat Rooms"]
                : view === "drill" ? [Flame, "Daily Drill"]
                : view === "quizbattle" ? [Trophy, "Quiz Battle"]
                : view === "caseround" ? [Users2, "Case Round"]
                : view === "project" && project ? [Folder, project.name]
                : [Folder, "Projects"];
              return <span className="cx-title-btn static"><Icon size={14} /> <span>{label}</span></span>;
            })()}
          </div>

          <div className="cx-top-r">
            {view === "chat" && lastAssistant?.library ? (
              <button
                className="cx-safe cx-dt off"
                onClick={() => openSettings("data")}
                title={`Library mode: ${lastAssistant.library.reason}. Answers come from the offline medical library until credits are topped up.`}
              >
                <Library size={14} /> Library mode
              </button>
            ) : (
              <button
                className={`cx-safe cx-dt ${prefs.safetyReview ? "" : "off"}`}
                onClick={() => { setView("safety"); setSidebarOpen(false); }}
                title={prefs.safetyReview ? "Every answer is audited by a second AI model before you see it. See how." : "Safety review is off"}
              >
                {prefs.safetyReview ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} Safety review {prefs.safetyReview ? "on" : "off"}
              </button>
            )}
            {view === "chat" && !active && (
              <button
                className={`cx-ib cx-temp-tg ${tempNext ? "on" : ""}`}
                title={tempNext ? "Temporary chat is on. Click to turn it off" : "Temporary chat: not saved, no memory"}
                onClick={() => { setTempNext((t) => !t); focusComposer(); }}
                aria-pressed={tempNext}
                aria-label="Temporary chat"
              >
                <MessageSquareDashed size={18} />
              </button>
            )}
            {view === "chat" && active?.temp && <span className="cx-temp-pill cx-m"><MessageSquareDashed size={14} /> Temporary</span>}
            {view === "chat" && active && messages.length > 0 && (
              <div className="cx-rel cx-dt" data-pop="export">
                <button className={`cx-ghost ${pop === "export" ? "open" : ""}`} onClick={() => togglePop("export")} aria-haspopup="menu" aria-expanded={pop === "export"}>
                  <Download size={15} /> Export <ChevronDown size={14} />
                </button>
                {pop === "export" && (
                  <div className="cx-pop cx-export-menu" role="menu">
                    <p className="cx-pop-gl">Download this chat</p>
                    <button className="cx-pop-i" onClick={() => exportSessionAs("word")}><FileDown size={16} /> Word document (.docx)</button>
                    <button className="cx-pop-i" onClick={() => exportSession()}><Download size={16} /> PDF</button>
                    <button className="cx-pop-i" onClick={() => exportSessionAs("md")}><FileText size={16} /> Markdown (.md)</button>
                    <div className="cx-pop-sep" />
                    <button className="cx-pop-i" onClick={() => { setPop(null); void copyText("chat", chatMarkdown(active)); }}><Copy size={16} /> Copy the whole chat</button>
                  </div>
                )}
              </div>
            )}
            <button className="cx-ib cx-dt" title={dark ? "Light theme" : "Dark theme"} onClick={() => setPrefs((p) => ({ ...p, theme: dark ? "light" : "dark" }))} aria-label="Toggle theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="cx-ib cx-m" onClick={() => newChat()} aria-label="New chat"><SquarePen size={18} /></button>
          </div>
        </header>

        <div
          className="cx-view"
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const near = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
            atBottomRef.current = near;
            setAtBottom(near);
          }}
        >
          {view === "calculators" ? (
            <ClinicalCalculators
              key={toolsInit.key}
              initialCalc={toolsInit.calc}
              initialTab={toolsInit.tab}
              initialDrugs={toolsInit.drugs}
              onAsk={(t, m) => send(t, m ?? "general")}
              toast={toast}
            />
          ) : view === "practice" ? (
            <LearnView
              key={practiceInit.key}
              initialTab={practiceInit.tab}
              profile={profile}
              practice={practice}
              setPractice={setPractice}
              learn={learn}
              setLearn={setLearn}
              generate={(body) => invokeCadus({ ...body, model: prefs.model })}
              onChat={(t, m, title) => send(t, m, { title })}
              onEditProfile={() => setProfileOpen(true)}
              friendlyError={friendlyError}
              toast={toast}
              canMock={limits.mocks}
              onLocked={() => setUpgrade({ reason: "Timed mock tests with NEET-style marks are part of Core and above.", feature: "mocks" })}
            />
          )
            : view === "research" ? (
              <ResearchView
                initial={researchInit}
                search={(body) => invokeCadus(body)}
                onSummarise={summariseEvidence}
                onAsk={(t, m) => send(t, (m as ModeId) ?? "general")}
                toast={toast}
                friendlyError={friendlyError}
              />
            )
            : view === "ward" ? (
              <WardView
                onAsk={(t, m, title) => send(t, m as ModeId, { title })}
                onOpenChecker={(drugs) => openCalculators({ tab: "ix", drugs })}
                letterhead={lh}
                toast={toast}
              />
            )
            : view === "drugs" ? (
              <DrugsView
                key={drugsInit.key}
                initialTab={drugsInit.tab}
                initialQuery={drugsInit.query}
                letterhead={!!lh}
                onPrint={(title, md) => { if (!limits.prescriber) { setUpgrade({ reason: "Printing prescriptions on your letterhead is part of Professional and above.", feature: "prescriber" }); return; } printDoc(title, md, { mode: "rx" }); }}
                onWord={(title, md) => { if (!limits.prescriber) { setUpgrade({ reason: "Word export of prescriptions is part of Professional and above.", feature: "prescriber" }); return; } downloadWord(title, md, "rx"); }}
                onAsk={(q, m) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, (m && MODE[m as ModeId] ? m : "general") as ModeId); }}
                onCheck={(drugs) => openCalculators({ tab: "ix", drugs })}
                toast={toast}
              />
            )
            : view === "scribe" ? (
              <ScribeView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, language: prefs.language, institution: institutionPayload(institution, "")?.payload })}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                onWord={(title, md) => downloadWord(title, md, "note")}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
                friendlyError={friendlyError}
                toast={toast}
                letterhead={!!lh}
                signer={lh ? [lh.name, lh.registration].filter(Boolean).join(", ") : profile?.fullName ? [profile.fullName, profile.registration].filter(Boolean).join(", ") : ""}
                language={prefs.language}
              />
            )
            : view === "emergency" ? (
              <EmergencyView toast={toast} onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} />
            )
            : view === "paeds" ? (
              <PaedsView onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} />
            )
            : view === "leaflets" ? (
              <LeafletsView
                generate={(body) => { if (!limits.reading && body.kind === "consent") { /* consent is open to all plans */ } return invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload }); }}
                onPrint={(title, md) => printDoc(title, md, { mode: "leaflet", large: true })}
                onWord={(title, md) => downloadWord(title, md, "leaflet")}
                friendlyError={friendlyError}
                toast={toast}
                letterhead={!!lh}
                defaultLanguage={prefs.language}
              />
            )
            : view === "simulator" ? (
              <CaseSimView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
              />
            )
            : view === "rxcheck" ? (
              <RxCheckView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
              />
            )
            : view === "watch" ? (
              <GuidelineWatchView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, language: prefs.language })}
                friendlyError={friendlyError}
                toast={toast}
                onSave={(question, answer, sources) => { setLibrary((l) => [{ id: uid(), sessionId: "", messageId: uid(), question, answer, mode: "research", at: Date.now(), sources: safeSources(sources) }, ...l]); toast("Saved to Library"); }}
              />
            )
            : view === "explain" ? (
              <ReportExplainView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "leaflet", large: true })}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
                defaultLanguage={prefs.language}
              />
            )
            : view === "translate" ? (
              <TranslatorView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                defaultLanguage={prefs.language}
              />
            )
            : view === "pathways" ? (
              <PathwaysView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, String(body.pathway ?? ""))?.payload })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
              />
            )
            : view === "flashcards" ? (
              <FlashcardsView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                seed={cardSeed}
                onSeedUsed={() => setCardSeed(null)}
              />
            )
            : view === "compare" ? (
              <CompareView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
              />
            )
            : view === "medrec" ? (
              <MedRecView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md, large) => printDoc(title, md, { mode: large ? "leaflet" : "note", large: !!large })}
                defaultLanguage={prefs.language}
              />
            )
            : view === "present" ? (
              <PresentCoachView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
              />
            )
            : view === "discharge" ? (
              <DischargeView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md, large) => printDoc(title, md, { mode: large ? "leaflet" : "discharge", large: !!large })}
                defaultLanguage={prefs.language}
                ward={wardInfo.patients.map((p) => ({ id: p.id, bed: p.bed, label: p.label, diagnosis: p.diagnosis, problems: p.problems, meds: p.meds, plan: p.plan, admittedOn: p.admittedOn }))}
              />
            )
            : view === "handover" ? (
              <HandoverView
                ward={wardInfo.patients.map((p) => ({ id: p.id, bed: p.bed, label: p.label, diagnosis: p.diagnosis, status: p.status, problems: p.problems, meds: p.meds, plan: p.plan, jobs: p.jobs }))}
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                onOpenWard={openWard}
              />
            )
            : view === "ddx" ? (
              <DifferentialView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
              />
            )
            : view === "studyplan" ? (
              <StudyPlanView
                learn={learn}
                setLearn={setLearn}
                practice={practice}
                defaultExam={profile?.exam ?? ""}
                defaultExamDate={profile?.examDate ?? ""}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general", { title: "Study plan quiz" }); }}
                onPractice={openPractice}
                toast={toast}
              />
            )
            : view === "podcasts" ? (
              <PodcastView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            )
            : view === "ecg" ? (
              <EcgView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }}
              />
            )
            : view === "abx" ? (
              <AntibioticView
                generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, `antibiotic ${String(body.infection ?? "")}`)?.payload })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
                hasPolicy={institution.on && !!institution.antibiotic.trim()}
              />
            )
            : view === "procedure" ? (
              <ProcedureView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md, large) => printDoc(title, md, { mode: large ? "leaflet" : "note", large: !!large })}
                defaultLanguage={prefs.language}
              />
            )
            : view === "poison" ? (
              <PoisonView
                generate={(body) => invokeCadus({ ...body, model: prefs.model })}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "note" })}
              />
            )
            : view === "infusions" ? <InfusionView />
            : view === "convert" ? <ConvertView />
            : view === "abg" ? <AbgView onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} />
            : view === "logbook" ? (
              <LogbookView toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "note" })} name={profile?.fullName ?? ""} department={institution.department || profile?.specialty || ""} />
            )
            : view === "followups" ? <FollowUpView toast={toast} />
            : view === "audiolib" ? <AudioLibraryView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} defaultLanguage={prefs.language} />
            : view === "rxwrite" ? <RxWriterView key={rxInit.key} initial={rxInit} generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "rx" })} onOpenPrescriber={() => openDrugs({ tab: "prescriber" })} defaultLanguage={prefs.language} />
            : view === "labtrend" ? <LabTrendsView generate={(body) => invokeCadus({ ...body, model: prefs.model })} readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))} friendlyError={friendlyError} toast={toast} onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} />
            : view === "daily" ? <DailyCaseView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} defaultLevel={profile?.role === "student" ? "mbbs" : profile?.role === "intern" ? "intern" : profile?.role === "aspirant" || profile?.role === "resident" ? "pg" : "mbbs"} />
            : view === "letters" || view === "adr" || view === "mccd" ? <DocWriterView key={view} tool={view} generate={(body) => invokeCadus({ ...body, model: prefs.model, institution: institutionPayload(institution, "")?.payload })} friendlyError={friendlyError} toast={toast} onPrint={(title, md, mode) => printDoc(title, md, { mode })} doctor={lh ? [lh.name, lh.qualifications, lh.designation, lh.registration].filter(Boolean).join(", ") : ""} />
            : view === "mnemonics" ? <MnemonicView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "generics" ? <GenericFinderView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "opd" ? <OpdQueueView toast={toast} onPrescribe={(p) => { setRxInit({ diagnosis: p.complaint, age: p.age, sex: p.sex, weight: p.weight, key: Date.now() }); openView("rxwrite"); }} onScribe={() => openView("scribe")} onPrint={(title, md) => printDoc(title, md, { mode: "" })} onRecord={(p) => { setRecInit({ ...p, key: Date.now() }); openView("records"); }} />
            : view === "imagequiz" ? <ImageQuizView generate={(body) => invokeCadus({ ...body, model: prefs.model })} readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))} friendlyError={friendlyError} toast={toast} />
            : view === "dosecard" ? <DoseCardView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "oncall" ? <OnCallView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "journal" ? <JournalClubView generate={(body) => invokeCadus({ ...body, model: prefs.model })} readFile={(f) => readAttachment(f, (img) => fileToDataUrl(img))} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} onSlides={(o) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(`Make journal club slides from this outline:\n\n${o}`, "slides", { title: "Journal club" }); }} />
            : view === "stats" ? <StatsChooserView toast={toast} onAsk={(q) => { if (pending) { toast("Wait for the current answer to finish"); return; } void send(q, "general"); }} />
            : view === "roster" ? <RosterView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "records" ? <RecordsView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} onPrescribe={(p) => { setRxInit({ ...p, key: Date.now() }); openView("rxwrite"); }} incoming={recInit} />
            : view === "voiceround" ? <VoiceRoundView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} language={prefs.language} />
            : view === "revnotes" ? <RevNotesView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} defaultExam={profile?.exam ?? ""} />
            : view === "analytics" ? <AnalyticsView />
            : view === "preop" ? <PreopView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "messages" ? <PatientMessageView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} defaultLanguage={prefs.language} clinic={lh ? [lh.hospital || lh.name, lh.phone].filter(Boolean).join(", ") : ""} />
            : view === "preglact" ? <PregLactView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "pillchart" ? <PillChartView onPrint={(title, md) => printDoc(title, md, { mode: "leaflet", large: true })} onOpenPrescriber={() => openDrugs({ tab: "prescriber" })} />
            : view === "vaccines" ? <VaccinesView toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} clinic={lh ? [lh.hospital || lh.name, lh.phone].filter(Boolean).join(", ") : ""} />
            : view === "diet" ? <DietView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "icd" ? <IcdView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "consent" ? <ConsentView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} defaultLanguage={prefs.language} hospital={lh ? lh.hospital || "" : ""} />
            : view === "insulin" ? <InsulinView onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} />
            : view === "transfusion" ? <TransfusionView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "mlc" ? <MlcView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "tb" ? <TbView onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} />
            : view === "antenatal" ? <AntenatalView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "ventilator" ? <VentilatorView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "teleconsult" ? <TeleconsultView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "rx" })} doctor={lh ? [lh.name, lh.qualifications, lh.registration].filter(Boolean).join(", ") : ""} language={prefs.language} />
            : view === "bills" ? <BillsView toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "" })} clinic={lh ? [lh.hospital || lh.name, lh.address, lh.phone].filter(Boolean).join(" · ") : ""} />
            : view === "bite" ? <AnimalBiteView onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} />
            : view === "needlestick" ? <NeedlestickView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "imnci" ? <ImnciView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "cme" ? <CmeView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "appointments" ? <AppointmentsView toast={toast} clinic={lh ? [lh.hospital || lh.name, lh.phone].filter(Boolean).join(", ") : ""} onOpenOpd={() => openView("opd")} />
            : view === "stock" ? <StockView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "screening" ? <ScreeningView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "kidney" ? <KidneyDoseView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} />
            : view === "sam" ? <SamView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "contacts" ? <ContactsView />
            : view === "accounts" ? <AccountsView />
            : view === "thyroid" ? <ThyroidView />
            : view === "backup" ? <BackupView toast={toast} />
            : view === "ncd" ? <NcdView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "anaemia" ? <AnaemiaView />
            : view === "dengue" ? <DengueView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "electrolytes" ? <ElectrolytesView />
            : view === "obsemergency" ? <ObsEmergencyView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "infection" ? <InfectionView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "asthma" ? <AsthmaView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "milestones" ? <MilestonesView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "contraception" ? <ContraceptionView />
            : view === "palliative" ? <PalliativeView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "imaging" ? <ImagingRulesView />
            : view === "ivfluids" ? <IvFluidsView />
            : view === "sickday" ? <SickDayView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "labranges" ? <LabRangesView />
            : view === "burns" ? <BurnsView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "jaundice" ? <JaundiceView />
            : view === "stroke" ? <StrokeView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "bundles" ? <SepsisDkaView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "alcohol" ? <AlcoholView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "dfoot" ? <DiabeticFootView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "heat" ? <HeatView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "wound" ? <WoundView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "anticoag" ? <AnticoagView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "fevers" ? <TropicalFeverView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "elderly" ? <ElderlyView />
            : view === "quitsmoking" ? <QuitSmokingView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "croup" ? <CroupView />
            : view === "rheumatic" ? <RheumaticView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "weight" ? <WeightView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "hypo" ? <HypoView />
            : view === "gdm" ? <GdmView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "infantfeed" ? <InfantFeedingView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "antidep" ? <AntidepView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "eyeent" ? <EyeEntView />
            : view === "vte" ? <VteView />
            : view === "headache" ? <HeadacheView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "skin" ? <SkinView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "gout" ? <GoutView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "pnuti" ? <PneumoniaUtiView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "ckd" ? <CkdView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "preterm" ? <PretermView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "epilepsy" ? <EpilepsyView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "childfever" ? <ChildFeverView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "cirrhosis" ? <CirrhosisView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "dementia" ? <DementiaView />
            : view === "htnemergency" ? <HtnEmergencyView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "ugib" ? <UgibView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "aki" ? <AkiView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "hepbc" ? <HepatitisView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "nrp" ? <NrpView />
            : view === "pain" ? <PainView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "bone" ? <BoneView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "hrt" ? <HrtView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "syncope" ? <SyncopeView />
            : view === "hf" ? <HfView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "af" ? <AfView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "lipids" ? <LipidsView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "pedvt" ? <PeDvtView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "hiv" ? <HivView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "preeclampsia" ? <PreEclampsiaView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "sleep" ? <SleepView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "urticaria" ? <UrticariaView />
            : view === "anaphylaxis" ? <AnaphylaxisView generate={(body) => invokeCadus({ ...body, model: prefs.model })} friendlyError={friendlyError} toast={toast} onPrint={(title, md) => printDoc(title, md, { mode: "leaflet" })} defaultLanguage={prefs.language} />
            : view === "trauma" ? <TraumaView />
            : view === "tox" ? <ToxView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "ptx" ? <PtxView />
            : view === "fluids" ? <FluidsView />
            : view === "steroid" ? <SteroidView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "refeed" ? <RefeedView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "backpain" ? <BackPainView />
            : view === "acs" ? <AcsView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "childfluids" ? <ChildFluidsView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "agitation" ? <AgitationView />
            : view === "suicide" ? <SuicideView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "headinjury" ? <HeadInjuryView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "abdomen" ? <AbdomenView />
            : view === "fneutro" ? <FneutroView />
            : view === "meningitis" ? <MeningitisView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "statusepi" ? <StatusEpiView />
            : view === "sodium" ? <SodiumView />
            : view === "attack" ? <AttackView />
            : view === "bridging" ? <BridgingView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "oncoemerg" ? <OncoEmergView />
            : view === "spirometry" ? <SpirometryView />
            : view === "thyroidstorm" ? <ThyroidStormView />
            : view === "sickle" ? <SickleView />
            : view === "hyperk" ? <HyperkView />
            : view === "pancreatitis" ? <PancreatitisView />
            : view === "paedsepsis" ? <PaedSepsisView />
            : view === "airway" ? <AirwayView />
            : view === "rhabdo" ? <RhabdoView />
            : view === "hypothermia" ? <HypothermiaView />
            : view === "paeddka" ? <PaedDkaView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "retention" ? <RetentionView />
            : view === "preghtn" ? <PregHtnView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "stones" ? <StonesView />
            : view === "paedabx" ? <PaedAbxView />
            : view === "opioid" ? <OpioidView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "cellulitis" ? <CellulitisView />
            : view === "kawasaki" ? <KawasakiView onPrint={(title, md) => printDoc(title, md, { mode: "" })} />
            : view === "endocarditis" ? <EndocarditisView />
            : view === "bell" ? <BellView />
            : view === "pph" ? <PphView />
            : view === "neosepsis" ? <NeoSepsisView />
            : view === "renalabx" ? <RenalAbxView />
            : view === "braindeath" ? <BrainDeathView />
            : view === "septicjoint" ? <SepticJointView />
            : view === "neohypo" ? <NeoHypoView />
            : view === "altitude" ? <AltitudeView />
            : view === "serotonin" ? <SerotoninView />
            : view === "paedasthma" ? <PaedAsthmaView />
            : view === "dkahhs" ? <DkaHhsView />
            : view === "ansteroid" ? <AntenatalSteroidView />
            : view === "ironb12" ? <IronB12View />
            : view === "tdm" ? <TdmView />
            : view === "contrast" ? <ContrastView />
            : view === "pressure" ? <PressureView />
            : view === "hyperemesis" ? <HyperemesisView />
            : view === "today" ? (
              <TodayView
                name={firstName}
                ward={wardInfo.patients.map((p) => ({ id: p.id, bed: p.bed, label: p.label, diagnosis: p.diagnosis, jobs: p.jobs }))}
                toggleJob={(pid, jid) => {
                  const w = readWard();
                  const next = { ...w, patients: w.patients.map((p) => (p.id === pid ? { ...p, jobs: p.jobs.map((j) => (j.id === jid ? { ...j, done: !j.done } : j)) } : p)) };
                  saveWard(next);
                  setWardInfo(next);
                  toast("Job done");
                }}
                learn={{ streak: streak(practice.days), due: cardStats(learn).due, toRevise: practice.mistakes.length }}
                activeCases={cases.filter((c) => c.status === "active").length}
                chats={sessions.filter((x) => !x.temp && !x.archived && x.messages.length).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5).map((x) => ({ id: x.id, title: x.title, updatedAt: x.updatedAt }))}
                questionsLeft={Number.isFinite(limits.questionsPerDay) && limits.questionsPerDay < 10000 ? Math.max(0, limits.questionsPerDay - (usage.date === today() ? usage.count : 0)) : null}
                go={(where, id) => {
                  if (where === "open-chat" && id) openSession(id);
                  else if (where === "chat") newChat();
                  else if (where === "ward") openWard();
                  else if (where === "cases") openCases();
                  else if (where === "practice") openPractice();
                  else openView(where as View);
                }}
              />
            )
            : view === "cases" ? (
              <CaseView
                cases={cases}
                onChange={setCases}
                chatsFor={(id) => sessions.filter((x) => x.caseId === id && !x.temp).sort((a, b) => b.updatedAt - a.updatedAt).map((x) => ({ id: x.id, title: x.title, updatedAt: x.updatedAt }))}
                onAsk={askAboutCase}
                onOpenChat={(sid) => openSession(sid)}
                onAddToWard={addCaseToWard}
                onShare={(c) => setShareItem({ kind: "case", title: caseLabel(c), summary: caseSummary(c), at: Date.now() })}
                toast={toast}
                openId={caseOpen}
                setOpenId={setCaseOpen}
              />
            )
            : view === "safety" ? (
              <SafetyView
                stats={auditSummary}
                reviewOn={prefs.safetyReview}
                onTurnOnReview={() => { setPrefs((p) => ({ ...p, safetyReview: true })); toast("Safety review is on"); }}
                calcCount={CALCULATORS.length}
                ixRules={IX_RULE_COUNT}
                onOpenHistory={() => setView("history")}
                onOpenPrivacy={() => setView("privacy")}
              />
            )
            : view === "history" ? (
              <HistoryView
                entries={audit}
                modeLabel={(m) => MODE[m as ModeId]?.label ?? m}
                sessionExists={(sid) => sessions.some((x) => x.id === sid)}
                onOpen={(sid, mid) => {
                  openSession(sid);
                  // Bring the answer into view and mark it briefly.
                  window.setTimeout(() => {
                    const el = document.querySelector<HTMLElement>(`.cx-a[data-mid="${CSS.escape(mid)}"]`);
                    const box = el?.closest<HTMLElement>(".cx-view");
                    if (!el || !box) return;
                    box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: "smooth" });
                    el.classList.add("is-flash");
                    window.setTimeout(() => el.classList.remove("is-flash"), 1800);
                  }, 160);
                }}
                onClear={() => { clearAudit(); setAudit([]); toast("Answer history cleared"); }}
                toast={toast}
              />
            )
            : view === "privacy" ? (
              <PrivacyView
                counts={{
                  chats: listed.length,
                  archived: archivedList.length,
                  docs: docs.length,
                  saved: library.length,
                  projects: projects.length,
                  ward: wardInfo.patients.length,
                  reading: readingCount,
                  memory: personal.memory.length,
                  history: audit.length,
                  hidden: auditSummary.hidden,
                  practice: ptot.attempted,
                  protocols: institution.protocols.length,
                  cases: cases.length,
                  letterhead: !!lh,
                  profile: !!profile,
                }}
                guardOn={prefs.privacyGuard}
                onToggleGuard={() => setPrefs((p) => ({ ...p, privacyGuard: !p.privacyGuard }))}
                actions={{
                  exportAll,
                  deleteChats: () => {
                    // An answer still arriving would bring its chat back.
                    if (pending) { toast("Wait for the current answer to finish, or stop it"); return; }
                    setSessions([]);
                    setActiveId("");
                    toast("All chats deleted");
                  },
                  deleteDocs: () => { setDocs([]); setCanvasId(""); toast("Documents deleted"); },
                  clearSaved: () => { setLibrary([]); toast("Saved answers cleared"); },
                  clearWard: () => { const w = cleanWard(null); saveWard(w); setWardInfo(w); toast("Ward list cleared"); },
                  clearReading: () => { saveReading([]); setReadingCount(0); toast("Reading list cleared"); },
                  manageMemory: () => openSettings("personal"),
                  editProfile: () => setProfileOpen(true),
                  openHistory: () => setView("history"),
                  clearPractice: () => { setPracticeState(EMPTY_PRACTICE); toast("Practice progress reset"); },
                  manageInstitution: () => openSettings("institution"),
                  clearCases: () => { setCases([]); setCaseOpen(""); toast("Patient cases deleted"); },
                  deleteEverything,
                }}
              />
            )
            : view === "tools" ? renderTools()
            : view === "crew" ? renderCrew()
            : view === "debate" ? (
              <CrewDebateView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                turn={async (c, o) => {
                  const r = await invokeCadus({ action: "debate-turn", crew: crewPayload(c), ...o, model: prefs.model, language: prefs.language });
                  if (!r?.message) throw new Error("No argument came back");
                  return String(r.message);
                }}
                judge={async (question, sides) => {
                  const r = await invokeCadus({ action: "debate-judge", question, sides, language: prefs.language });
                  if (!r?.result) throw new Error("No verdict came back");
                  return r.result;
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `This uses ${n} of today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
                onSave={(question, answer) => { setLibrary((l) => [{ id: uid(), sessionId: "", messageId: uid(), question, answer, mode: "general", at: Date.now() }, ...l]); toast("Saved to Library"); }}
              />
            )
            : view === "playbooks" ? (
              <CrewPlaybookView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `This uses ${n} of today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
                onSave={(question, answer) => { setLibrary((l) => [{ id: uid(), sessionId: "", messageId: uid(), question, answer, mode: "general", at: Date.now() }, ...l]); toast("Saved to Library"); }}
                onContinue={(c, q, answer) => {
                  const sid = uid();
                  const u: Msg = { id: uid(), role: "user", mode: "general", at: Date.now(), content: q };
                  const a: Msg = { id: uid(), role: "assistant", mode: "general", at: Date.now(), content: answer, mention: { id: c.id, name: c.name, icon: c.icon, tone: c.tone } };
                  upsert(sid, () => [u, a], clip(q, 64), undefined, { crewId: c.id });
                  setActiveId(sid);
                  setView("chat");
                  focusComposer();
                }}
              />
            )
            : view === "crewschedules" ? (
              <CrewSchedulesView
                mine={crewMine}
                list={crewSchedules}
                setList={setCrewSchedules}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                onStart={(x) => { const c = findCrew(x.crewId, crewMine); if (!c) { toast("That assistant is no longer in your Crew"); return; } setCrewSchedules((l) => l.map((y) => (y.id === x.id ? { ...y, lastDone: dateKey() } : y))); startCrew(c); setInput(x.prompt); }}
                toast={toast}
              />
            )
            : view === "crewworkspaces" ? (
              <CrewWorkspacesView
                mine={crewMine}
                notes={crewNotes}
                state={crewWs}
                setState={setCrewWs}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                onChat={(c) => startCrew(c)}
                onTemplate={(t) => { setTemplatesCrew(t.crewId); openView("crewtemplates"); }}
                onNotes={() => openView("crewnotes")}
                toast={toast}
              />
            )
            : view === "crewdigest" ? (
              <CrewDigestView
                build={(days) => buildDigest({
                  chats: sessions.filter((x) => x.crewId).map((x) => ({ at: x.updatedAt, crewId: x.crewId as string, question: (x.messages.find((mm) => mm.role === "user")?.content ?? x.title).slice(0, 140) })),
                  quiz: readQuizResults(), drill: readDrill(), rounds: readCaseRounds(), notes: crewNotes.notes, checkins: crewCheckins.history, ratings: crewRatings,
                  crewName: (id) => findCrew(id, crewMine)?.name ?? "an assistant",
                }, Date.now(), days)}
                onPrint={(title, md) => printDoc(title, md, { mode: "" })}
                toast={toast}
              />
            )
            : view === "crewcompare" ? (
              <CrewCompareView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "crewvoice" ? (
              <CrewVoiceView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "crewtemplates" ? (
              <CrewTemplatesView
                key={templatesCrew || "all"}
                mine={crewMine}
                initialCrew={templatesCrew || undefined}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                onRun={(c, text) => { startCrew(c); setInput(text); toast(`Ready in a chat with ${c.name}: press send`); }}
                toast={toast}
              />
            )
            : view === "crewtimeline" ? <CrewTimelineView events={crewTimelineNow()} onPrint={(title, md) => printDoc(title, md, { mode: "" })} toast={toast} />
            : view === "crewnotes" ? (
              <CrewNotesView
                mine={crewMine}
                notes={crewNotes}
                setNotes={setCrewNotes}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "checkins" ? (
              <CrewCheckinsView
                mine={crewMine}
                state={crewCheckins}
                setState={setCrewCheckins}
                who={profile ? `${profile.role}${profile.specialty ? ` in ${profile.specialty}` : ""}` : undefined}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "crewstats" ? <CrewStatsView stats={crewStatsNow()} />
            : view === "rooms" ? (
              <CrewRoomsView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "drill" ? (
              <CrewDrillView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "quizbattle" ? (
              <CrewQuizView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
              />
            )
            : view === "caseround" ? (
              <CrewCaseRoundView
                mine={crewMine}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
                onPrint={(title, md) => printDoc(title, md, { mode: "" })}
              />
            )
            : view === "second" ? (
              <CrewSecondOpinionView
                key={secondPick || "second"}
                mine={crewMine}
                initial={secondPick}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
                onContinue={(c, q, answer) => {
                  const sid = uid();
                  const u: Msg = { id: uid(), role: "user", mode: "general", at: Date.now(), content: q };
                  const a: Msg = { id: uid(), role: "assistant", mode: "general", at: Date.now(), content: answer, mention: { id: c.id, name: c.name, icon: c.icon, tone: c.tone } };
                  upsert(sid, () => [u, a], clip(q, 64), undefined, { crewId: c.id });
                  setActiveId(sid);
                  setView("chat");
                  focusComposer();
                }}
              />
            )
            : view === "huddle" ? (
              <CrewHuddleView
                mine={crewMine}
                initial={huddleInit}
                badge={(c, size) => <CrewBadge c={c} size={size} />}
                ask={async (c, q) => {
                  const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) });
                  if (!r?.message) throw new Error("No answer came back");
                  return String(r.message);
                }}
                merge={async (question, answers) => {
                  const r = await invokeCadus({ action: "huddle-merge", question, answers, language: prefs.language });
                  if (!r?.answer) throw new Error("No combined answer came back");
                  return r as HuddleResult;
                }}
                canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `A huddle of ${n} uses ${n} of today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
                friendlyError={friendlyError}
                toast={toast}
                onSave={(question, answer) => { setLibrary((l) => [{ id: uid(), sessionId: "", messageId: uid(), question, answer, mode: "general", at: Date.now() }, ...l]); toast("Saved to Library"); }}
                onContinue={(c, q, answer) => {
                  const sid = uid();
                  const u: Msg = { id: uid(), role: "user", mode: "general", at: Date.now(), content: q };
                  const a: Msg = { id: uid(), role: "assistant", mode: "general", at: Date.now(), content: answer, mention: { id: c.id, name: c.name, icon: c.icon, tone: c.tone } };
                  upsert(sid, () => [u, a], clip(q, 64), undefined, { crewId: c.id });
                  setActiveId(sid);
                  setView("chat");
                  focusComposer();
                }}
              />
            )
            : view === "library" ? renderLibrary()
            : view === "projects" ? renderProjects()
            : view === "project" ? renderProject()
            : view === "decks" ? renderDecks()
            : isHome ? renderHome()
            : renderThread()}
        </div>

        {showDock && (
          <div className="cx-dock">
            {!isHome && !atBottom && (
              <button className="cx-scrolldown" onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })} aria-label="Scroll to latest"><ArrowDown size={17} /></button>
            )}
            <div className="cx-dock-in">
              {(active?.temp || (isHome && tempNext)) && (
                <div className="cx-temp-bar">
                  <MessageSquareDashed size={14} />
                  <span><b>Temporary chat.</b> Not saved to your history, and memory isn't used or updated.</span>
                </div>
              )}
              {sim && !pending && (
                <div className="cx-sim-bar">
                  <span>
                    {sim === "viva" ? <MessageCircleQuestion size={15} /> : <UserRound size={15} />}
                    {sim === "viva" ? "Viva in progress: answer in the box below." : "OSCE station in progress: ask the patient your questions."}
                  </span>
                  <button onClick={() => send("Finish and score", sim)}><Target size={14} /> Finish and score</button>
                </div>
              )}
              {composer("dock")}
              <p className="cx-fine">
                {lastAssistant?.library
                  ? "Library mode: AI credits are unavailable, so answers come from the offline medical library without the safety review. Verify clinical decisions."
                  : lastUser && ROLEPLAY.has(lastUser.mode)
                    ? "Viva and OSCE practice is not safety-reviewed. Check key facts against your textbooks."
                    : prefs.safetyReview
                    ? "Answers are audited by a second AI model, but Cadus can still make mistakes. Verify clinical decisions."
                    : "Safety review is off. Cadus can make mistakes; verify clinical decisions."}
              </p>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept={ACCEPT_ATTACH} multiple hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
      </main>

      {/* ============================================== sources beside the chat */}
      {sourcesFor && !canvasDoc && view === "chat" && (() => {
        const msg = messages.find((x) => x.id === sourcesFor.mid);
        const list = msg ? safeSources(shownVersion(msg).sources) : [];
        return list.length ? (
          <SourcesPanel sources={list} focus={sourcesFor.n} question={clip(stripPlaceholders(questionFor(msg!)) || questionFor(msg!), 140)} onClose={() => setSourcesFor(null)} />
        ) : null;
      })()}
      {citePrev && (() => {
        const msg = messages.find((x) => x.id === citePrev.mid);
        const src = msg ? safeSources(shownVersion(msg).sources).find((x) => x.n === citePrev.n) : undefined;
        if (!src) return null;
        return (
          <div
            className={`cx-citecard ${citePrev.above ? "above" : ""}`}
            style={{ left: citePrev.x, top: citePrev.y }}
            role="tooltip"
            onMouseEnter={() => window.clearTimeout(citeTimer.current)}
            onMouseLeave={hideCite}
          >
            <span className="n">{src.n}</span>
            <span className="t"><b>{src.title}</b><small>{hostOf(src.url)}</small></span>
            <a href={src.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source ${src.n}`}><ExternalLink size={14} /></a>
          </div>
        );
      })()}

      {/* ============================================== canvas */}
      {canvasDoc && (
        <CanvasPanel
          key={canvasDoc.id}
          doc={canvasDoc}
          onChange={updateDoc}
          onClose={closeCanvas}
          aiEdit={canvasEdit}
          exportPdf={(title, text) => void exportPdf(title, [{ who: "", text }], { letterhead: lh, signature: SIGNED_MODES.has(canvasDoc.mode ?? "") })}
          exportWord={(title, text) => downloadWord(title, text, canvasDoc.mode)}
          print={(title, text) => printDoc(title, text, { mode: canvasDoc.mode, large: canvasDoc.mode === "patient" })}
          letterhead={!!lh}
          toast={toast}
        />
      )}

      {/* row menu (fixed so the scrolling list doesn't clip it) */}
      {rowMenuSession && rowPos && (
        <div
          className="cx-pop cx-row-menu"
          data-pop={pop ?? ""}
          style={{ position: "fixed", top: rowPos.top, left: rowPos.left, width: 232, maxHeight: `calc(100vh - ${rowPos.top + 12}px)` }}
          role="menu"
        >
          {sessionMenuItems(rowMenuSession, "side")}
        </div>
      )}

      {/* ============================================== project dialog */}
      {crewEdit && (
        <div className="cx-overlay center" onMouseDown={() => setCrewEdit(null)}>
          <form
            className="cx-dialog cx-crew-dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); saveCrewEdit(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cx-ce-title"
          >
            <div className="cx-dialog-h">
              <div className="cx-crew-dh">
                <CrewBadge c={crewEdit} size={44} />
                <div>
                  <h3 id="cx-ce-title">{crewEdit.id && crewMine.some((c) => c.id === crewEdit.id) ? `Edit ${crewEdit.name || "assistant"}` : "Create an assistant"}</h3>
                  <p>Tell it who it is and how to answer. It keeps to Cadus's clinical standards.</p>
                </div>
              </div>
              <button type="button" className="cx-ib" onClick={() => setCrewEdit(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="cx-dialog-b">
              <div className="cx-crew-f2">
                <label className="cx-field">
                  <span>Name</span>
                  <input className="cx-input" autoFocus maxLength={CREW_NAME_MAX} value={crewEdit.name} onChange={(e) => setCrewEdit({ ...crewEdit, name: e.target.value })} placeholder="e.g. Cardiology Registrar" />
                </label>
                <label className="cx-field">
                  <span>One line about it <span className="opt">(optional)</span></span>
                  <input className="cx-input" maxLength={TAGLINE_MAX} value={crewEdit.tagline} onChange={(e) => setCrewEdit({ ...crewEdit, tagline: e.target.value })} placeholder="e.g. Answers like my unit's senior registrar" />
                </label>
              </div>
              <div className="cx-crew-f2 cx-crew-persona" data-crew="persona">
                <label className="cx-field">
                  <span>Avatar <span className="opt">(an emoji or 2 letters)</span></span>
                  <input className="cx-input" value={crewEdit.avatar ?? ""} onChange={(e) => setCrewEdit({ ...crewEdit, avatar: e.target.value.slice(0, 8) })} placeholder="e.g. 🩺 or RK" data-crew-f="avatar" />
                </label>
                <label className="cx-field">
                  <span>Greeting <span className="opt">(shown when a chat starts)</span></span>
                  <input className="cx-input" maxLength={200} value={crewEdit.greeting ?? ""} onChange={(e) => setCrewEdit({ ...crewEdit, greeting: e.target.value })} placeholder="e.g. Namaste! Send me the case and I'll help you present it." data-crew-f="greeting" />
                </label>
                <label className="cx-field">
                  <span>Sign-off <span className="opt">(added to every answer)</span></span>
                  <input className="cx-input" maxLength={80} value={crewEdit.signoff ?? ""} onChange={(e) => setCrewEdit({ ...crewEdit, signoff: e.target.value })} placeholder="e.g. Check with your senior before acting." data-crew-f="signoff" />
                </label>
              </div>
              <label className="cx-field">
                <span>Instructions</span>
                <textarea className="cx-input cx-crew-instr" maxLength={CREW_INSTRUCTIONS_MAX} value={crewEdit.instructions} onChange={(e) => setCrewEdit({ ...crewEdit, instructions: e.target.value })}
                  placeholder="Who it is, who it helps and how it should answer. e.g. You are a cardiology registrar at a government medical college. Answer for an MD Medicine resident: follow ESC and CSI guidance, give doses for Indian formulations, and end every answer with what to tell the consultant." />
                <small>{crewEdit.instructions.length} / {CREW_INSTRUCTIONS_MAX}. Avoid patient names or other identifying details.</small>
              </label>
              {crewEdit.instructions.trim().length > 0 && (() => { const sc = instructionScore(crewEdit); return (
                <div className={`cx-crew-coach ${sc.score >= 8 ? "good" : sc.score >= 5 ? "ok" : "low"}`} data-crew="coach">
                  <b>Instruction coach: {sc.score}/10</b>
                  {sc.tips.length ? <ul>{sc.tips.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul> : <span> Clear and complete.</span>}
                </div>
              ); })()}
              <div className="cx-field">
                <span>First questions <span className="opt">(optional, up to 4)</span></span>
                <div className="cx-crew-starters-ed">
                  {[0, 1, 2, 3].map((i) => (
                    <input key={i} className="cx-input" maxLength={STARTER_MAX} value={crewEdit.starters[i] ?? ""} placeholder={i === 0 ? "e.g. Approach to a broad complex tachycardia" : ""}
                      onChange={(e) => { const st = [...crewEdit.starters]; st[i] = e.target.value; setCrewEdit({ ...crewEdit, starters: st.slice(0, 4) }); }} />
                  ))}
                </div>
              </div>
              <div className="cx-crew-f2">
                <label className="cx-field">
                  <span>Tool</span>
                  <select className="cx-input" value={crewEdit.mode} onChange={(e) => setCrewEdit({ ...crewEdit, mode: e.target.value })}>
                    <option value="general">General answers</option>
                    {GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>{g.ids.map((id) => <option key={id} value={id}>{MODE[id].label}</option>)}</optgroup>
                    ))}
                  </select>
                </label>
                <label className="cx-field cx-crew-src">
                  <span>Sources</span>
                  <span className="cx-crew-toggle"><input type="checkbox" checked={!!crewEdit.sources} onChange={(e) => setCrewEdit({ ...crewEdit, sources: e.target.checked })} /> Search trusted sources for every answer</span>
                </label>
              </div>
              <CrewKnowledge
                docs={crewEdit.knowledge ?? []}
                onChange={(knowledge) => setCrewEdit((x) => (x ? { ...x, knowledge } : x))}
                extract={async (f) => { const r = await invokeCadus({ action: "extract-text", files: [f] }); if (!r?.text) throw new Error("No text came back"); return String(r.text); }}
                toast={toast}
              />
              <div className="cx-field">
                <span>Look</span>
                <div className="cx-crew-look">
                  <div className="icons" role="radiogroup" aria-label="Icon">
                    {CREW_ICONS.map((ic) => { const I = CREW_ICON[ic]; return <button type="button" key={ic} role="radio" aria-checked={crewEdit.icon === ic} className={crewEdit.icon === ic ? "on" : ""} onClick={() => setCrewEdit({ ...crewEdit, icon: ic })} aria-label={ic}><I size={16} /></button>; })}
                  </div>
                  <div className="tones" role="radiogroup" aria-label="Colour">
                    {CREW_TONES.map((t) => <button type="button" key={t} role="radio" aria-checked={crewEdit.tone === t} className={`tone-${t} ${crewEdit.tone === t ? "on" : ""}`} onClick={() => setCrewEdit({ ...crewEdit, tone: t })} aria-label={t} />)}
                  </div>
                </div>
              </div>
            </div>
            <div className="cx-dialog-f">
              <span className="count">Kept in this browser</span>
              <button type="button" className="cx-btn" onClick={() => setCrewEdit(null)}>Cancel</button>
              <button type="submit" className="cx-btn primary" disabled={!crewEdit.name.trim() || !crewEdit.instructions.trim()}>{crewEdit.id && crewMine.some((c) => c.id === crewEdit.id) ? "Save changes" : "Create"}</button>
            </div>
          </form>
        </div>
      )}
      {projectDialog && (
        <div className="cx-overlay center" onMouseDown={() => setProjectDialog(null)}>
          <form
            className="cx-dialog"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); saveProjectDialog(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cx-pd-title"
          >
            <div className="cx-dialog-h">
              <div>
                <h3 id="cx-pd-title">{projectDialog.id ? "Edit project" : "Create a project"}</h3>
                <p>{projectDialog.id ? "Changes apply to new answers in this project." : "Group related chats and tell Cadus how to answer in them."}</p>
              </div>
              <button type="button" className="cx-ib" onClick={() => setProjectDialog(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="cx-dialog-b">
              <label className="cx-field">
                <span>Name</span>
                <input
                  className="cx-input"
                  autoFocus
                  maxLength={60}
                  value={projectDialog.name}
                  onChange={(e) => setProjectDialog({ ...projectDialog, name: e.target.value })}
                  placeholder="e.g. Cardiology rotation"
                />
              </label>
              <label className="cx-field">
                <span>Instructions <span style={{ fontWeight: 400, color: "var(--t3)" }}>(optional)</span></span>
                <textarea
                  className="cx-input"
                  maxLength={INSTRUCTIONS_MAX}
                  value={projectDialog.instructions}
                  onChange={(e) => setProjectDialog({ ...projectDialog, instructions: e.target.value })}
                  placeholder="e.g. I'm a final-year MBBS student preparing for NEET-PG. Keep answers exam-focused, highlight high-yield facts and follow Indian guidelines where they exist."
                />
                <small>Cadus follows these for audience, focus and format. Its clinical standards and safety review always come first. Avoid patient names or other identifying details.</small>
              </label>
            </div>
            <div className="cx-dialog-f">
              <span className="count">{projectDialog.instructions.length} / {INSTRUCTIONS_MAX}</span>
              <button type="button" className="cx-btn" onClick={() => setProjectDialog(null)}>Cancel</button>
              <button type="submit" className="cx-btn primary" disabled={!projectDialog.name.trim()}>{projectDialog.id ? "Save changes" : "Create project"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================== command palette */}
      {paletteOpen && (
        <div className="cx-overlay" onMouseDown={() => setPaletteOpen(false)}>
          <div className="cx-palette" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
            <div className="cx-pal-in">
              <Search size={18} />
              <input
                autoFocus
                value={palQuery}
                placeholder="Search chats, tools and actions…"
                onChange={(e) => { setPalQuery(e.target.value); setPalIndex(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setPalIndex((i) => Math.min(palFlat.length - 1, i + 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setPalIndex((i) => Math.max(0, i - 1)); }
                  if (e.key === "Enter") { e.preventDefault(); runPalette(palFlat[palIndex]); }
                }}
              />
              <kbd>Esc</kbd>
            </div>
            <div className="cx-pal-list">
              {palFlat.length === 0 && <p className="cx-pal-empty">No results for “{palQuery}”</p>}
              {(() => {
                let i = -1;
                return paletteSections.map((sec) => (
                  <div key={sec.label}>
                    <p className="cx-pal-gl">{sec.label}</p>
                    {sec.items.map((it) => {
                      i += 1;
                      const idx = i;
                      return (
                        <button key={it.key} className={`cx-pal-i ${idx === palIndex ? "on" : ""}`} onMouseEnter={() => setPalIndex(idx)} onClick={() => runPalette(it)}>
                          <it.icon size={16} /><span>{it.label}</span>{it.hint && <small>{it.hint}</small>}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
            <div className="cx-pal-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================== settings */}
      {settingsOpen && (
        <div className="cx-overlay center" onMouseDown={() => setSettingsOpen(false)}>
          <div className="cx-settings" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Settings">
            <nav className="cx-set-nav">
              <h2>Settings</h2>
              {([
                ["general", "General", Settings],
                ["personal", "Personalisation", Palette],
                ["letterhead", "Letterhead", FileSignature],
                ["institution", "Institution", Building2],
                ["data", "Data and privacy", Database],
                ["shortcuts", "Shortcuts", Keyboard],
                ["about", "About", Info],
              ] as [SettingsTab, string, LucideIcon][]).map(([id, label, Icon]) => (
                <button key={id} className={settingsTab === id ? "on" : ""} onClick={() => setSettingsTab(id)}><Icon size={16} /> {label}</button>
              ))}
            </nav>
            <div className="cx-set-body">
              <div className="cx-set-head">
                <h3>{{ general: "General", personal: "Personalisation", letterhead: "Letterhead", institution: "Institution", data: "Data and privacy", shortcuts: "Keyboard shortcuts", about: "About Cadus" }[settingsTab]}</h3>
                <button className="cx-ib" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={18} /></button>
              </div>
              <div className="cx-set-scroll">
                {settingsTab === "general" && (
                  <>
                    <div className="cx-set-row">
                      <div><b>Theme</b><small>Light is the default. Dark is easier on the eyes at night. Auto follows your device.</small></div>
                      <div className="cx-seg">
                        {(["light", "dark", "system"] as const).map((t) => (
                          <button key={t} className={prefs.theme === t ? "on" : ""} onClick={() => setPrefs({ ...prefs, theme: t })}>
                            {t === "light" ? <Sun size={13} /> : t === "dark" ? <Moon size={13} /> : <Laptop size={13} />}{t === "light" ? "Light" : t === "dark" ? "Dark" : "Auto"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Reply language</b><small>Cadus answers in this language</small></div>
                      <select className="cx-select" value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })} aria-label="Reply language">
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="cx-set-row cx-set-col" data-settings="voice">
                      <div><b>Voice</b><small>The voice that reads answers aloud and speaks in voice mode, the Translator, patient audio and podcasts</small></div>
                      <VoiceSettings toast={toast} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Units</b><small>Conventional units (mg/dL) as most Indian laboratories report them, or SI units first (mmol/L), with the other in brackets.</small></div>
                      <div className="cx-seg">
                        <button className={prefs.units === "conventional" ? "on" : ""} onClick={() => setPrefs({ ...prefs, units: "conventional" })}>Conventional</button>
                        <button className={prefs.units === "si" ? "on" : ""} onClick={() => setPrefs({ ...prefs, units: "si" })}>SI</button>
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Prefer essential medicines</b><small>Medicines on India's National List of Essential Medicines (NLEM 2022) and generic names first, noting any that aren't on it.</small></div>
                      <button className={`cx-switch ${prefs.nlem ? "on" : ""}`} role="switch" aria-checked={prefs.nlem} aria-label="Prefer essential medicines" onClick={() => setPrefs({ ...prefs, nlem: !prefs.nlem })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Enter to send</b><small>Use Shift + Enter for a new line</small></div>
                      <button className={`cx-switch ${prefs.enterToSend ? "on" : ""}`} role="switch" aria-checked={prefs.enterToSend} aria-label="Enter to send" onClick={() => setPrefs({ ...prefs, enterToSend: !prefs.enterToSend })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Safety review</b><small>A second model audits every answer before you see it: Cadus Magnus 3.6 for clinical answers, Cadus Medius 3.1 for study content. Adds about 10 to 20 seconds. Recommended.</small></div>
                      <button className={`cx-switch ${prefs.safetyReview ? "on" : ""}`} role="switch" aria-checked={prefs.safetyReview} aria-label="Safety review" onClick={() => setPrefs({ ...prefs, safetyReview: !prefs.safetyReview })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b>Search sources by default</b><small>Cite live sources from WHO, NICE, ICMR, PubMed and other trusted medical sites. Deep research always searches.</small></div>
                      <button className={`cx-switch ${prefs.sources ? "on" : ""}`} role="switch" aria-checked={prefs.sources} aria-label="Search sources by default" onClick={() => setPrefs({ ...prefs, sources: !prefs.sources })} />
                    </div>
                    <div className="cx-set-row">
                      <div><b><Bell size={14} className="cx-set-ic" /> Notifications</b><small>Get a notification when an answer is ready while Cadus is in a background tab, handy during long reviews and deep research.</small></div>
                      <button className={`cx-switch ${prefs.notify ? "on" : ""}`} role="switch" aria-checked={prefs.notify} aria-label="Notifications" onClick={() => void toggleNotify()} />
                    </div>
                  </>
                )}
                {settingsTab === "personal" && (
                  <>
                    <div className="cx-set-row">
                      <div><b>Your profile</b><small>{profile ? `${profileSummary(profile)}${profile.state ? ` · ${profile.state}` : ""}. Answers, quick actions and practice questions are tailored to you.` : "Tell Cadus whether you're a student, an exam aspirant, an intern or a doctor, and answers are pitched at your level."}</small>{badge && <span className="cx-set-badge"><ShieldCheck size={13} /> {badge} · self-declared</span>}</div>
                      <span className="cx-set-legal"><button className="cx-btn" onClick={() => setProfileOpen(true)}><UserCog size={14} /> {profile ? "Edit" : "Set up"}</button><button className="cx-btn" onClick={() => { setSettingsOpen(false); setSetupState("needed"); }} title="Name, institution, registration and contact, saved to your account">Account profile</button></span>
                    </div>
                    <PersonalSettings personal={personal} setPersonal={setPersonal} toast={toast} />
                    <p className="cx-set-sub">Appearance</p>
                    <div className="cx-set-row cx-set-look">
                      <div><b>Look</b><small>Three complete looks. Each sets the typefaces, surfaces, spacing and corners; your colour and font choices below apply on top.</small></div>
                      <div className="cx-look-pick" role="radiogroup" aria-label="Look">
                        {LOOKS.map((l) => (
                          <button key={l.id} role="radio" aria-checked={prefs.look === l.id} className={`look-${l.id} ${prefs.look === l.id ? "on" : ""}`} title={l.hint} onClick={() => setPrefs({ ...prefs, look: l.id })}>
                            <span className="cx-look-prev" aria-hidden="true"><i /><em><b /><b /><b /></em></span>
                            <b>{l.name}</b><small>{l.hint}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Answer font</b><small>Serif reads like a well-set textbook and is easier on long answers. Tables and doses always use the sans.</small></div>
                      <div className="cx-seg">
                        <button className={serif ? "on" : ""} onClick={() => setPrefs({ ...prefs, answerFont: "serif" })}><span className="ff serif">Aa</span>Serif</button>
                        <button className={!serif ? "on" : ""} onClick={() => setPrefs({ ...prefs, answerFont: "sans" })}><span className="ff">Aa</span>Sans</button>
                      </div>
                    </div>
                    <p className={`cx-font-prev ${serif ? "serif" : ""}`}>
                      <b>Bottom line:</b> Cadus answers are set in {serif ? "Newsreader, a serif designed for long-form reading on screens" : "Plus Jakarta Sans, the clean sans-serif used across Aethex"}, so dense clinical detail stays easy to read.
                    </p>
                    <div className="cx-set-row cx-set-wall">
                      <div><b>Wallpaper</b><small>A quiet pattern behind the chat, in your accent colour. Answers keep a plain background.</small></div>
                      <div className="cx-wall-pick" role="radiogroup" aria-label="Wallpaper">
                        {WALLPAPERS.map((w) => {
                          const css = wallpaperCss(w.id, `color-mix(in srgb, ${dark ? accent.dark : accent.light} ${w.id === "mesh" ? 55 : 80}%, transparent)`, dark);
                          return (
                            <button key={w.id} role="radio" aria-checked={prefs.wallpaper === w.id} className={prefs.wallpaper === w.id ? "on" : ""} title={w.hint} onClick={() => setPrefs({ ...prefs, wallpaper: w.id })}>
                              <span style={css ? { backgroundImage: css.image, backgroundSize: css.size === "100% 100%" ? css.size : css.size.split(" ").map((v) => `calc(${v} * .6)`).join(" ") } : undefined} />
                              <small>{w.name}</small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Accent colour</b><small>{accent.name}. Used for highlights, links and focus</small></div>
                      <div className="cx-swatch">
                        {ACCENTS.map((a) => (
                          <button key={a.id} className={prefs.accent === a.id ? "on" : ""} style={{ background: dark ? a.dark : a.light }} onClick={() => setPrefs({ ...prefs, accent: a.id })} aria-label={a.name} title={a.name} />
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Default response mode</b><small>Also available from the Cadus menu at the top</small></div>
                      <div className="cx-seg">
                        {STYLES.map((s) => (
                          <button key={s.id} className={prefs.style === s.id ? "on" : ""} onClick={() => setPrefs({ ...prefs, style: s.id })}><s.icon size={13} />{s.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Density</b><small>Compact fits more on the screen, for busy shifts on small laptops.</small></div>
                      <div className="cx-seg">
                        <button className={prefs.density !== "compact" ? "on" : ""} onClick={() => setPrefs({ ...prefs, density: "comfortable" })}>Comfortable</button>
                        <button className={prefs.density === "compact" ? "on" : ""} onClick={() => setPrefs({ ...prefs, density: "compact" })}><Rows3 size={13} />Compact</button>
                      </div>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Text size</b><small>Size of answers and messages</small></div>
                      <div className="cx-seg">
                        {(["s", "m", "l"] as const).map((s) => (
                          <button key={s} className={prefs.textSize === s ? "on" : ""} onClick={() => setPrefs({ ...prefs, textSize: s })}>{s === "s" ? "Small" : s === "m" ? "Default" : "Large"}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {settingsTab === "letterhead" && <LetterheadSettings value={letterhead} onChange={setLetterhead} toast={toast} />}
                {settingsTab === "institution" && (limits.institution ? <InstitutionSettings value={institution} onChange={setInstitution} letterhead={letterhead} onLetterhead={setLetterhead} toast={toast} /> : (
                  <div className="cx-empty-state cx-locked"><span className="cx-proj-ic" style={{ marginBottom: 0 }}><Building2 size={20} /></span><h3>Institution protocols are an Enterprise feature</h3><p>Medical colleges and hospitals on the Enterprise plan put their own protocols and formulary into every answer, with team packs, admin and usage reports for the whole institution.</p><a className="cx-btn primary" href={plansHref}>See the Enterprise plan <ArrowRight size={14} /></a></div>
                ))}
                {settingsTab === "data" && (
                  <>
                    <div className="cx-set-links">
                      <button onClick={() => { setSettingsOpen(false); setView("privacy"); }}><EyeOff size={16} /><span><b>Privacy centre</b><small>What's kept, what's sent, and controls for each</small></span></button>
                      <button onClick={() => { setSettingsOpen(false); setView("history"); }}><History size={16} /><span><b>Answer history</b><small>{audit.length} records, exportable for audit</small></span></button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Where your data lives</b><small>Chats, projects, documents, Library items, memory, your profile, practice progress, your ward list, reading list and letterhead are stored only in this browser, so they don't sync between devices yet. Messages, attachments, custom instructions and memory are sent securely to the AI to generate answers. Temporary chats are never stored.</small></div>
                    </div>
                    <div className="cx-set-row">
                      <div>
                        <b>Archived chats</b>
                        <small>{archivedList.length ? `${archivedList.length} archived chat${archivedList.length === 1 ? "" : "s"}. They're hidden from the sidebar but kept, and still show up in search.` : "Archive a chat from its menu to hide it from the sidebar without deleting it."}</small>
                      </div>
                      <button className="cx-btn" disabled={!archivedList.length} onClick={() => setArchivedOpen((o) => !o)}><Archive size={14} /> {archivedOpen && archivedList.length ? "Hide" : "Manage"}</button>
                    </div>
                    {archivedOpen && archivedList.length > 0 && (
                      <ul className="cx-arch">
                        {archivedList.map((x) => (
                          <li key={x.id}>
                            <button className="cx-arch-t" onClick={() => { setSettingsOpen(false); openSession(x.id); }}><b>{x.title}</b><small>{relTime(x.updatedAt)}</small></button>
                            <button className="cx-ib" title="Restore" onClick={() => setArchived(x.id, false)} aria-label={`Restore ${x.title}`}><ArchiveRestore size={16} /></button>
                            <button className="cx-ib danger" title="Delete" onClick={() => deleteSession(x.id)} aria-label={`Delete ${x.title}`}><Trash2 size={16} /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="cx-set-row">
                      <div><b>Privacy guard</b><small>Before a message is sent, Cadus replaces patient identifiers with placeholders: names, phone numbers, Aadhaar and ABHA numbers, UHID and other record numbers, dates of birth, addresses and email addresses. It is a safety net, so still avoid typing identifiers. Recommended.</small></div>
                      <button className={`cx-switch ${prefs.privacyGuard ? "on" : ""}`} role="switch" aria-checked={prefs.privacyGuard} aria-label="Privacy guard" onClick={() => setPrefs({ ...prefs, privacyGuard: !prefs.privacyGuard })} />
                    </div>
                    <div className="cx-set-row">
                      <div>
                        <b>Offline medical library</b>
                        <small>
                          {libInfo === undefined
                            ? "Checking…"
                            : libInfo === null
                              ? "Not installed. If the AI credits run out, the backup model answers on its own."
                              : `${libInfo.articles.toLocaleString("en-IN")} articles from ${Object.values(libInfo.sources).map((x) => x.name.split(" (")[0].split(" via ")[0]).join(", ")}. Built ${new Date(libInfo.builtAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Cadus answers from it automatically when the AI credits run out.`}
                          {libInfo && !libInfo.sources.w && " Wikipedia's medical articles are added by the GitHub workflow “Build Cadus medical library”."}
                        </small>
                      </div>
                      {libInfo && <span className="cx-plan">Ready</span>}
                    </div>
                    {libInfo && (
                      <div className="cx-libtest">
                        <form onSubmit={(e) => { e.preventDefault(); void runLibraryTest(); }}>
                          <Search size={15} />
                          <input value={libTestQ} onChange={(e) => setLibTestQ(e.target.value)} placeholder="Test the library, e.g. myasthenia gravis" aria-label="Search the offline library" />
                          <button type="submit" className="cx-btn" disabled={!libTestQ.trim()}>Search</button>
                        </form>
                        {libTest && (
                          libTest.busy ? <p className="cx-libtest-note">Searching…</p>
                          : libTest.hits.length ? (
                            <ol>
                              {libTest.hits.map((h) => (
                                <li key={`${h.title}-${h.source}`}><a href={h.url} target="_blank" rel="noopener noreferrer">{h.title}</a><span>{h.source}</span></li>
                              ))}
                            </ol>
                          ) : <p className="cx-libtest-note">No articles match “{libTest.q}”.</p>
                        )}
                      </div>
                    )}
                    <div className="cx-set-row">
                      <div><b>Back up everything on this device</b><small>Chats and every tool's data (patient records, receipts, stock, appointments) in one file, optionally locked with a passphrase; restore here or on another computer</small></div>
                      <button className="cx-btn" onClick={() => { setSettingsOpen(false); openView("backup"); }} data-set="backup"><Download size={14} /> Backup &amp; Restore</button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Export all chats</b><small>{listed.length + archivedList.length} chats, {projects.length} projects, {docs.length} documents and {library.length} saved answers, with your memory, custom instructions, reading list and letterhead, as a JSON file</small></div>
                      <button
                        className="cx-btn"
                        onClick={exportAll}
                        disabled={!sessions.length && !library.length && !projects.length && !docs.length}
                      >
                        <Download size={14} /> Export
                      </button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Clear Library</b><small>Remove all {library.length} saved answers</small></div>
                      <button className="cx-btn danger" disabled={!library.length} onClick={() => { setLibrary([]); toast("Library cleared"); }}><Trash2 size={14} /> Clear</button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Delete all chats</b><small>This can't be undone</small></div>
                      <button
                        className={`cx-btn danger ${confirmClear ? "armed" : ""}`}
                        disabled={!sessions.length}
                        onClick={() => {
                          if (!confirmClear) { setConfirmClear(true); return; }
                          setSessions([]);
                          setActiveId("");
                          setConfirmClear(false);
                          toast("All chats deleted");
                        }}
                      >
                        <Trash2 size={14} /> {confirmClear ? "Click again to confirm" : "Delete all"}
                      </button>
                    </div>
                  </>
                )}
                {settingsTab === "shortcuts" && (
                  <div className="cx-keys">
                    <div><span>Search and command palette</span><span><kbd>{MOD}</kbd><kbd>K</kbd></span></div>
                    <div><span>New chat</span><span><kbd>{MOD}</kbd><kbd>⇧</kbd><kbd>O</kbd></span></div>
                    <div><span>Send message</span><span><kbd>Enter</kbd></span></div>
                    <div><span>New line</span><span><kbd>⇧</kbd><kbd>Enter</kbd></span></div>
                    <div><span>Copy the last answer</span><span><kbd>{MOD}</kbd><kbd>⇧</kbd><kbd>C</kbd></span></div>
                    <div><span>Show or hide the sidebar</span><span><kbd>{MOD}</kbd><kbd>⇧</kbd><kbd>S</kbd></span></div>
                    <div><span>Delete this chat (press twice)</span><span><kbd>{MOD}</kbd><kbd>⇧</kbd><kbd>⌫</kbd></span></div>
                    <div><span>Focus the message box</span><span><kbd>⇧</kbd><kbd>Esc</kbd></span></div>
                    <div><span>Show keyboard shortcuts</span><span><kbd>{MOD}</kbd><kbd>/</kbd></span></div>
                    <div><span>Paste an image or file into the message</span><span><kbd>{MOD}</kbd><kbd>V</kbd></span></div>
                    <div><span>Close menus, dialogs and Canvas</span><span><kbd>Esc</kbd></span></div>
                  </div>
                )}
                {settingsTab === "about" && (
                  <>
                    <div className="cx-about">
                      <CadusMark size={48} />
                      <div><h4>Cadus {CADUS_VERSION}</h4><p>Clinical AI by Aethex</p></div>
                    </div>
                    <div className="cx-set-row"><div><b>How Cadus answers</b><small>1. Cadus Medius 3.1, or Cadus Magnus 3.6 if you pick it, drafts each answer to the Cadus clinical standards: evidence-based, structured, dose-checked and aware of Indian guidance. 2. Cadus Magnus 3.6 audits clinical answers for doses, interactions, red flags and invented facts, and corrects them (Medius 3.1 checks study content). 3. With Sources on, Cadus searches trusted medical sites and cites them. 4. If the AI credits run out, Cadus switches to Library mode: it answers from its offline medical library (Wikipedia, NIH and the Disease Ontology), cites each article and labels the answer. A backup model covers other outages.</small></div></div>
                    <div className="cx-set-row"><div><b>Built-in tools</b><small>{CALCULATORS.length} clinical calculators, lab trend charts, the thesis kit's sample-size formulas and the interaction checker run in your browser from published formulas and a curated drug list, so they are exact and not generated by AI. PubMed search returns real papers with their PMIDs and DOIs; Cadus summarises only the abstracts you select. The ward round list, practice progress and reading list stay on this device. The privacy guard hides patient identifiers before anything is sent.</small></div></div>
                    <div className="cx-set-row"><div><b>Limitations</b><small>Cadus is decision support for qualified professionals and students. It is not a certified medical device, and the safety review reduces errors without eliminating them. Confirm diagnoses and doses against current guidelines and local protocols.</small></div></div>
                    <div className="cx-set-links">
                      <button onClick={() => { setSettingsOpen(false); setView("safety"); }}><ShieldCheck size={16} /><span><b>Clinical safety</b><small>How answers are drafted, checked and sourced</small></span></button>
                      <button onClick={startTour}><Compass size={16} /><span><b>Take the tour</b><small>Thirty seconds on where things are</small></span></button>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Your plan</b><small>{PLAN_BY_ID[plan].name}: {PLAN_BY_ID[plan].tagline} {limits.questionsPerDay === Infinity ? "Unlimited questions." : `${limits.questionsPerDay} questions a day.`}</small></div>
                      <a className="cx-link" href={plansHref}>Plans and pricing <ExternalLink size={13} /></a>
                    </div>
                    <div className="cx-set-row">
                      <div><b>Terms, privacy and disclaimer</b><small>The terms of use, how data is handled, and what Cadus is not. Release notes are on the About page.</small></div>
                      <span className="cx-set-legal"><a className="cx-link" href={legalPath("about")}>About</a><a className="cx-link" href={legalPath("terms")}>Terms</a><a className="cx-link" href={legalPath("privacy")}>Privacy</a><a className="cx-link" href={legalPath("disclaimer")}>Disclaimer</a></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {profileOpen && <ProfileDialog profile={profile} onSave={updateProfile} onClose={() => setProfileOpen(false)} />}
      {shareItem && <ShareDialog item={shareItem} onClose={() => setShareItem(null)} toast={toast} dark={dark} />}
      {crewShare && <CrewShareDialog c={crewShare} base={`${window.location.origin}${window.location.pathname}`} badge={<CrewBadge c={crewShare} size={44} />} dark={dark} onClose={() => setCrewShare(null)} toast={toast} />}
      {crewSettings && <CrewCardSettings c={crewSettings} style={crewStyles[crewSettings.id]} org={crewOrg} badge={<CrewBadge c={crewSettings} size={44} />} onStyle={(st) => setCrewStyles((m) => setStyle(m, crewSettings.id, st))} onOrg={setCrewOrg} memory={crewMemory} onMemory={setCrewMemory} onClose={() => setCrewSettings(null)} />}
      {translateMsg !== null && (
        <CrewTranslateDialog
          text={translateMsg}
          translate={async (prompt) => {
            const r = await invokeCadus({ action: "chat", message: prompt, mode: "general", history: [], model: prefs.model, language: "English" });
            if (!r?.message) throw new Error("No translation came back");
            return String(r.message);
          }}
          canAsk={(n) => { if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; } setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n })); return true; }}
          friendlyError={friendlyError}
          toast={toast}
          onClose={() => setTranslateMsg(null)}
        />
      )}
      {shareCard && <CrewShareCardDialog {...shareCard} toast={toast} onClose={() => setShareCard(null)} />}
      {factCheck && (
        <CrewFactCheckDialog
          question={factCheck.question}
          answer={factCheck.answer}
          mine={crewMine}
          badge={(c, size) => <CrewBadge c={c} size={size} />}
          ask={async (c, q) => { const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], crew: crewPayload(c), model: prefs.model, language: prefs.language, search: limits.sources && !!c.sources, ...(profilePayload(profile) ? { profile: profilePayload(profile) } : {}) }); if (!r?.message) throw new Error("No answer came back"); return String(r.message); }} canAsk={(n) => { if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; } setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n })); return true; }}
          friendlyError={friendlyError}
          toast={toast}
          onClose={() => setFactCheck(null)}
        />
      )}
      {handoffFrom && (
        <CrewHandoffDialog
          from={handoffFrom}
          mine={crewMine}
          messages={(active?.messages ?? []).map((x) => ({ role: x.role, content: x.content }))}
          badge={(c, size) => <CrewBadge c={c} size={size} />}
          onConfirm={(to, brief) => { setHandoffFrom(null); startCrew(to); setInput(brief); toast(`Handed off to ${to.name}: press send when ready`); }}
          onClose={() => setHandoffFrom(null)}
        />
      )}
      {crewImprove && (
        <CrewImproveDialog
          c={crewImprove}
          ratings={crewRatings[crewImprove.id] ?? []}
          badge={<CrewBadge c={crewImprove} size={44} />}
          improve={async (q) => {
            const r = await invokeCadus({ action: "chat", message: q, mode: "general", history: [], model: prefs.model, language: "English" });
            if (!r?.message) throw new Error("No answer came back");
            return String(r.message);
          }}
          canAsk={(n) => {
                  if (usage.date === today() && usage.count + n > limits.questionsPerDay) { setUpgrade({ reason: `You have used today's ${limits.questionsPerDay} questions on the ${PLAN_BY_ID[plan].name} plan.`, feature: "questions" }); return false; }
                  setUsage((u) => (u.date === today() ? { ...u, count: u.count + n } : { date: today(), count: n }));
                  return true;
                }}
          friendlyError={friendlyError}
          toast={toast}
          onApply={(instructions) => {
            const c = crewImprove;
            if (c.builtIn) setCrewEdit({ ...c, id: "", builtIn: undefined, group: undefined, name: `${c.name} (mine)`.slice(0, CREW_NAME_MAX), instructions });
            else { setCrewMine((l) => l.map((x) => (x.id === c.id ? { ...x, instructions, updatedAt: Date.now() } : x))); toast(`${c.name} has the new instructions`); }
            setCrewImprove(null);
          }}
          onClear={() => setCrewRatings((r) => { const n = { ...r }; delete n[crewImprove.id]; return n; })}
          onClose={() => setCrewImprove(null)}
        />
      )}
      {crewImport && <CrewImportDialog c={crewImport} badge={<CrewBadge c={crewImport} size={44} />} already={crewMine.some((x) => x.name === crewImport.name)} onAdd={() => addImported(crewImport)} onClose={() => setCrewImport(null)} />}
      {onboardOpen && (
        <Onboarding
          languages={LANGUAGES}
          language={prefs.language}
          profile={profile}
          units={prefs.units}
          nlem={readFlag(ONBOARD_KEY) ? prefs.nlem : true}
          onDone={finishOnboarding}
          onCancel={readFlag(ONBOARD_KEY) ? () => setOnboardOpen(false) : undefined}
        />
      )}
      {tourOpen && <Tour steps={TOUR_STEPS} onClose={endTour} />}
      {toastMsg && <div className="cx-toast" role="status"><Check size={15} /> {toastMsg}</div>}
      {upgrade && (
        <div className="cx-overlay center" onMouseDown={() => setUpgrade(null)}>
          <div className="cx-dialog cx-upgrade" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cx-up-t">
            <div className="cx-dialog-h">
              <div><h3 id="cx-up-t"><Sparkles size={18} /> {upgrade.feature === "questions" ? "Daily limit reached" : `Part of the ${planFor(upgrade.feature).name} plan`}</h3><p>{upgrade.reason}</p></div>
              <button className="cx-ib" onClick={() => setUpgrade(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="cx-dialog-b">
              <p className="cx-up-now">You are on <b>{PLAN_BY_ID[plan].name}</b>{limits.questionsPerDay !== Infinity ? ` · ${usage.date === today() ? usage.count : 0} of ${limits.questionsPerDay} questions used today` : ""}.</p>
              <p className="cx-up-price" data-up="price">{(upgrade.feature === "questions" ? PLAN_BY_ID.core : planFor(upgrade.feature)).name}: <b>{priceText(upgrade.feature === "questions" ? PLAN_BY_ID.core : planFor(upgrade.feature))}</b>, what you can use:</p>
              <ul className="cx-up-list">{(upgrade.feature === "questions" ? PLAN_BY_ID.core : planFor(upgrade.feature)).includes.slice(0, 4).map((x) => <li key={x}><Check size={14} /> {x}</li>)}</ul>
              <div className="cx-up-acts"><a className="cx-btn primary" href={plansHref}>See plans and prices <ArrowRight size={14} /></a><button className="cx-btn" onClick={() => setUpgrade(null)}>Not now</button></div>
              <p className="cx-up-foot">Plans are activated by invoice: request one and Aethex switches your account on the same day.</p>
            </div>
          </div>
        </div>
      )}
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} onCapture={(f) => { setCameraOpen(false); void onFile(f); }} />}
      {deck && <PresentationViewer data={deck} onClose={() => setDeck(null)} />}
      {voiceOpen && <VoiceMode language={prefs.language} ask={voiceAsk} onClose={() => setVoiceOpen(false)} persona={voicePersona} />}
      {lightbox && (
        <div className="cx-lightbox" onClick={() => setLightbox("")} role="dialog" aria-modal="true" aria-label="Image preview">
          <img src={lightbox} alt="Attached image, enlarged" />
          <button className="cx-ib" onClick={() => setLightbox("")} aria-label="Close preview"><X size={20} /></button>
        </div>
      )}
      {dragDepth > 0 && (
        <div className="cx-drop" aria-hidden>
          <div className="cx-drop-card">
            <span className="cx-drop-ic"><Paperclip size={24} /></span>
            <b>Drop files to attach</b>
            <small>Images, PDFs and text files, such as X-rays, ECGs, lab reports and discharge summaries</small>
          </div>
        </div>
      )}
    </div>
  );
}
