export type UIFieldType =
  | 'number'
  | 'text'
  | 'textbox'
  | 'select'
  | 'combobox'
  | 'dropdown'
  | 'button'
  | 'checkbox'
  | 'note'
  | (string & {});

export interface UIFieldSchema {
  key: string;
  label: string;
  ui_type: UIFieldType;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  container?: string;
  container_title?: string;
  group?: string;
  show_group_title?: boolean;
  options?: string[];
  placeholder?: string;
  placeholder_dynamic?: string;
  required?: boolean;
  action?: string;
  button_label?: string;
  is_material_field?: boolean;
  member_type?: string;
  post_row?: {
    kind: string;
    icon?: string;
  };
  disabled_options?: string[];
  note?: string;
}

export interface ValidateFieldResponse {
  valid: boolean;
  corrected_value?: any;
  message?: string;
}

export interface BackendValidationResponse {
  status?: boolean;
  is_valid?: boolean;
  valid?: boolean;
  errors?: Record<string, string> | string[];
  message?: string;
  corrected_values?: Record<string, any>;
}
