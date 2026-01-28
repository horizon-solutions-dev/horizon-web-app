export interface Company {
  id: number;
  name: string;
  role: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
  company: Company | null;
}

export interface FormErrors {
  email?: string;
  password?: string;
  company?: string;
}

export interface StepState {
  current: number;
  isSubmitting: boolean;
  isValid: Record<string, boolean>;
}

export interface ValidationOptions {
  email: string;
  password: string;
  company: string;
}

export interface CompanySelectEvent {
  company: Company;
  step: number;
  timestamp: Date;
}

export interface CompanyButtonProps {
  company: Company;
  isSelected: boolean;
  onClick: (company: Company) => void;
  disabled?: boolean;
}

export interface SessionData {
  user: {
    email: string;
    company: Company;
  };
  token?: string;
  expiresAt?: Date;
}

export interface AuthContextType {
  user: LoginFormValues | null;
  login: (credentials: LoginFormValues) => Promise<SessionData>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface FormConfig {
  steps: {
    [key: number]: {
      title: string;
      fields: string[];
      nextButton: string;
    };
  };
  validation: ValidationOptions;
}

export interface MultiStepLoginState {
  step: number;
  values: LoginFormValues;
  errors: FormErrors;
  touched: Record<string, boolean>;
  companies: Company[];
  isLoading: boolean;
}

export interface UseMultiStepLoginReturn {
  state: MultiStepLoginState;
  actions: {
    nextStep: () => void;
    prevStep: () => void;
    setFieldValue: (field: keyof LoginFormValues, value: unknown) => void;
    validateField: (field: keyof LoginFormValues) => Promise<void>;
    handleSubmit: () => Promise<void>;
    selectCompany: (company: Company) => void;
  };
  helpers: {
    shouldShowError: (fieldName: keyof LoginFormValues) => boolean;
    isStepValid: (stepNumber: number) => boolean;
    canGoNext: boolean;
    canGoBack: boolean;
  };
}