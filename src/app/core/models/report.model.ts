export interface ExtendedReport {
  approved_by?: any;
  ou_business_unit?: any;
  ou_department: string;
  ou_department_id: string;
  ou_employee_id?: any;
  ou_id: string;
  ou_level: string;
  ou_level_id: string;
  ou_location: string;
  ou_mobile: string;
  ou_org_id: string;
  ou_org_name: string;
  ou_status: string;
  ou_sub_department: string;
  ou_title: string;
  report_approvals?: any;
  rp_amount: number;
  rp_approval_state?: any;
  rp_approved_at?: any;
  rp_claim_number: string;
  rp_created_at: Date;
  rp_currency: string;
  rp_exported: boolean;
  rp_from_dt?: any;
  rp_id: string;
  rp_locations: any[];
  rp_manual_flag: boolean;
  rp_num_transactions: number;
  rp_org_user_id: string;
  rp_physical_bill: boolean;
  rp_physical_bill_at?: any;
  rp_policy_flag: boolean;
  rp_purpose: string;
  rp_reimbursed_at?: any;
  rp_risk_state?: any;
  rp_risk_state_expense_count?: any;
  rp_settlement_id?: any;
  rp_source?: any;
  rp_state: string;
  rp_submitted_at?: any;
  rp_tax?: any;
  rp_to_dt?: any;
  rp_trip_request_id?: any;
  rp_type: string;
  rp_verification_state?: any;
  rp_verified: boolean;
  sequential_approval_turn: boolean;
  us_email: string;
  us_full_name: string;
}

export interface ExtendedReportStats {
  total_amount: number;
  total_count: number;
  state?: string;
  title?: string;
  warning?: boolean;
}

export interface ReportParams {
  state: string[];
}
