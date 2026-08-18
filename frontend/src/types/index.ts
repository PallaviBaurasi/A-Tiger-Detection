export interface User {
  id: number;
  employee_id: string;
  name: string;
  role: 'ADMIN' | 'FOREST_OFFICER' | 'FIELD_STAFF' | 'REVIEWER' | string;
  department: string;
  shift: string;
  is_active: boolean;
}

export interface OfficerData {
  officer_id: string;
  name: string;
  designation: string;
  shift: 'Morning' | 'Evening' | 'Night' | string;
  shift_start: string;
  shift_end: string;
  duty_location: string;
  status: 'Active' | 'Inactive' | string;
  is_on_duty?: boolean;
}

export interface CameraStation {
  id: number;
  station_code: string;
  station_name: string;
  latitude: number;
  longitude: number;
  zone: string;
  region_type: 'CORE' | 'BUFFER' | 'VILLAGE_ADJACENT';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  installation_date: string;
}

export interface ImageRecord {
  id: number;
  filename: string;
  original_path: string;
  processed_path?: string;
  station_id: number;
  captured_at: string;
  file_size: number;
  status: 'PENDING' | 'BLANK' | 'QUARANTINED' | 'RETAINED' | 'REVIEW_REQUIRED' | 'PROCESSED' | 'ERROR';
  subject_detected: string;
  subject_type: string;
  detection_confidence: number;
  bounding_box?: string;
  processing_run_id?: number;
  created_at: string;
}

export interface Tiger {
  id: number;
  tiger_code: string;
  display_name: string;
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN';
  approximate_age: string;
  first_seen: string;
  last_seen: string;
  status: 'ACTIVE' | 'DISPLACED' | 'MISSING' | 'INACTIVE';
  profile_image_url?: string;
  capture_count?: number;
  station_count?: number;
  occupied_area_sq_km?: number;
}

export interface TigerCapture {
  id: number;
  tiger_id: number;
  image_id: number;
  station_id: number;
  captured_at: string;
  latitude: number;
  longitude: number;
  identification_confidence: number;
  identification_method: 'AI_MATCH' | 'HUMAN_CONFIRMED' | 'NEW_INDIVIDUAL';
  review_status: 'CONFIRMED' | 'REVIEW_PENDING' | 'REJECTED';
}

export interface ProcessingRun {
  id: number;
  started_at: string;
  completed_at?: string;
  total_images: number;
  blank_images: number;
  retained_images: number;
  tiger_images: number;
  new_tigers: number;
  reviewed_images: number;
  processing_time: number;
  storage_saved: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPLETED_WITH_REVIEW';
}

export interface Alert {
  id: number;
  tiger_id?: number;
  alert_type: 'RANGE_SHIFT' | 'NEW_STATION' | 'BUFFER_MOVEMENT' | 'VILLAGE_APPROACH' | 'PROLONGED_ABSENCE' | 'DATA_ARTIFACT' | 'REVIEW_REQUIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  detected_change?: string;
  supporting_evidence?: string;
  confidence: number;
  station_id?: number;
  is_artefact: 'YES' | 'NO' | 'UNCERTAIN';
  created_at: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
}

export interface DashboardSummary {
  kpis: {
    total_images_processed: number;
    quarantined_blank_images: number;
    retained_images: number;
    review_queue_count: number;
    active_tigers_identified: number;
    active_camera_stations: number;
    active_alerts_count: number;
    total_processing_runs: number;
    estimated_storage_saved_gb: number;
  };
  recent_alerts: Alert[];
  recent_sightings: any[];
  tiger_overview: any[];
}

export interface DashboardMetrics {
  active_tigers_count: number;
  total_captures_count: number;
  active_alerts_count: number;
  quarantined_images_count: number;
  retained_images_count: number;
  storage_saved_mb: number;
  recent_alerts: any[];
  recent_captures: any[];
  tigers_summary: any[];
}
