export interface ExtendedAdvance {
  account_current_balance_amount: number;
  account_id: string;
  account_name: string;
  account_target_balance_amount: number;
  account_tentative_balance_amount: number;
  account_type: string;
  adv_advance_number: string;
  adv_amount: number;
  adv_card_number: any;
  adv_created_at: Date;
  adv_currency: string;
  adv_exported: false;
  adv_id: string;
  adv_issued_at: Date;
  adv_mode: string;
  adv_orig_amount: number;
  adv_orig_currency: string;
  adv_payment_id: string;
  adv_purpose: string;
  adv_refcode: any;
  adv_settlement_id: string;
  adv_source: string;
  areq_approved_at: Date;
  areq_custom_field_values: string;
  areq_id: string;
  assignee_business_unit: string;
  assignee_department_id: string;
  assignee_level_id: string;
  assignee_ou_id: string;
  assignee_ou_org_id: string;
  assignee_us_email: string;
  assignee_us_full_name: string;
  creator_ou_id: string;
  creator_ou_org_id: string;
  creator_us_email: string;
  creator_us_full_name: string;
  custom_properties: any;
  ou_assignee_employee_id: string;
  ou_location: string;
  ou_title: string;
  project_code: any;
  project_id: number;
  project_name: string;
}
