import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, tap, finalize } from 'rxjs';
import { AgencyService } from 'src/app/services/agency-service';
import { alertnotifications } from 'src/app/services/alertnotifications';
import { CommonModule } from '@angular/common';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Modal } from 'bootstrap';
import { HasPermissionDirective } from 'src/app/directives/has-permission.directive';
import { HasAnyPermissionDirective } from 'src/app/directives/has-any-permission.directive';
import { Result } from '../../../Setup/agency/agency';
import { TranslateModule } from '@ngx-translate/core';
import { Regional } from 'src/app/services/regional';
import { DistrictResults } from 'src/app/models/others';
import { FinancialYearsService } from 'src/app/services/financial-year';
import { ElectricityServices } from 'src/app/services/electricity-services';
import { StatisticsServices } from 'src/app/services/statistics-services';
import { DomSanitizer } from '@angular/platform-browser';
import { FileUploader } from '../../../file-uploader/file-uploader';
import { InputRestrictDirective } from 'src/app/directives/input-restrict.directive';
import { GeneralInfoFormComponent } from '../../../general-info-form.component/general-info-form.component';

export interface ApiResponse {
  links: { next: string | string; previous: string | string };
  count: number;
  total_pages: number;
  page_size: number;
  current_page: number;
  results: IPPStatsDetails[];
}

export interface IPPStatsDetails {
  id: number;
  financial_year: number;
  stats: number;
  stats_detail: StatsDetail;
  reporting_period: string;
  financial_year_detail: FinancialYearDetail;
  submitted_by_detail: EdByDetail;
  reported_by_detail: EdByDetail;
  reviewed_by_detail: EdByDetail;
  reporting_entity_detail: ReportingEntityDetail;
  reporting_date: Date;
  reporting_entity: number;
  reported_by: number;
  contact_person: string;
  submission_status: string;
  submitted_at: Date;
  submitted_by: number;
  reviewed_at: Date;
  reviewed_by: number;
  review_remarks: string;
  elec_ipp_stats: ElecIPPStat[];
  elec_ipp_docs: ElecIPPDoc[];
  elec_ipp_stats_upload: ElecIPPStatsUpload[];
}

export interface ElecIPPDoc {
  id: number;
  name: string;
  file: string;
  description: string;
  file_size: number;
}

export interface ElecIPPStat {
  id: number;
  submission: number;
  ipp_name: string;
  license_number: string;
  country_of_origin: string;
  contact_information: string;
  total_production_capacity: string;
  energy_source: number;
  commercial_operation_date: Date;
  energy_source_detail: EnergySourceDetail;
}

export interface EnergySourceDetail {
  id: number;
  name: string;
}

export interface ElecIPPStatsUpload {
  file: string;
}

export interface FinancialYearDetail {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
}

export interface EdByDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  name: string;
}

export interface ReportingEntityDetail {
  id: number;
  title: string;
  report_to_ministry_detail: ReportToMinistryDetail;
  govt_detail: GovtDetail;
}

export interface GovtDetail {
  id: number;
  title: string;
  description: string;
}

export interface ReportToMinistryDetail {
  id: number;
  title: string;
  description: string;
  govt: number;
  govt_detail: GovtDetail;
}

export interface StatsDetail {
  id: number;
  title: string;
}

export interface IPPOperationsDetails {
  id: number;
  submission: number;
  ipp: number;
  ipp_name: string;
  project_name: string;
  location: number;
  energy_source: number;
  installed_capacity_mw: string;
  available_capacity_mw: string;
  grid_connected: string;
  power_purchase_agreement: string;
  purchase_duration_years: number;
  remarks: string;
  energy_source_detail: EnergySourceDetail;
  location_detail: LocationDetail;
}

export interface EnergySourceDetail {
  id: number;
  name: string;
}

export interface LocationDetail {
  id: number;
  name: string;
  country: number;
  country_detail: CountryDetail;
}

export interface CountryDetail {
  id: number;
  name: string;
  code: string;
}

export interface RegionResult {
  id: number;
  created: string;
  modified: string;
  name: string;
  code: string;
  active: boolean;
  created_by: string;
  updated_by: string;
}

export interface modu {
  id: string;
  title: string;
}

export interface Detail {
  id: number;
  title: string;
  name: string;
  email: string;
}

export interface FYDetail {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

export interface Document {
  id: number;
  file_url: string;
  created: Date;
  modified: Date;
  name: string;
  file: File;
  created_by?: number;
  updated_by?: number;
  project?: number;
  description: string;
  milestone?: number;
  type?: string;
  size?: string;
}

@Component({
  selector: 'app-elec-ipp',
  imports: [NgSelectComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HasPermissionDirective,
    HasAnyPermissionDirective,
    TranslateModule,
    FileUploader,
    InputRestrictDirective,
    GeneralInfoFormComponent],
  templateUrl: './elec-ipp.html',
  styleUrl: './elec-ipp.scss'
})
export class ElecIpp implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private agencyService = inject(AgencyService);
  private electricityService = inject(ElectricityServices);
  private regionService = inject(Regional);
  private FinancialYearService = inject(FinancialYearsService);
  private alertService = inject(alertnotifications);
  private techtypesService = inject(StatisticsServices);

  agencyInput$ = new Subject<string>();
  agencyLoading = false;

  regionInput$ = new Subject<string>();
  regionLoading = false;
  districtInput$ = new Subject<string>();
  districtLoading = false;
  expandedRow: number | null = null;

  @Output() formSubmit = new EventEmitter<any>();

  filterIPPStatsDetails: ApiResponse = {
    links: { next: null, previous: null },
    count: 0,
    total_pages: 1,
    page_size: 20,
    current_page: 1,
    results: []
  };

  agencies: Result[] = []; // for dropdown population
  IPPStatsDetails: IPPStatsDetails[] = []; // full Agencies list for selection
  regions: RegionResult[] = [];

  finances: any[];
  techtypes: any[];
  energies: any[];

  tempDistrictIds: number[] = [];
  tempWardIds: number[] = [];

  plants: modu[] = [
    { id: 'operational', title: 'Operational' },
    { id: 'under_maintenance', title: 'Under Maintenance' },
    { id: 'commissioning', title: 'Commissioning' },
    { id: 'shutdowm', title: 'Shutdown' }
  ];

  gender: modu[] = [
    { id: 'male', title: 'Male' },
    { id: 'female', title: 'Female' }
  ];

  modes: modu[] = [
    { id: 'free', title: 'Free' },
    { id: 'sold', title: 'Sold' }
  ];

  incomeLevel: modu[] = [
    { id: 'low', title: 'Low' },
    { id: 'medium', title: 'Medium' },
    { id: 'high', title: 'High' }
  ];

  frequencies: modu[] = [
    { id: 'monthly', title: 'Monthly' },
    { id: 'quarterly', title: 'Quarterly' },
    { id: 'half_yearly', title: 'Half Year' },
    { id: 'annual', title: 'Annual' }
  ];

  classifications: modu[] = [
    { id: 'urban', title: 'Urban' },
    { id: 'rural', title: 'Rural' },
    { id: 'semi_urban', title: 'Semi Urban' },
    { id: 'peri_urban', title: 'Peri Urban' }
  ];

  segments: modu[] = [
    { id: 'COMMERCIAL', title: 'Commercial' },
    { id: 'RESIDENTIAL', title: 'Residential' },
    { id: 'INDUSTRIAL', title: 'Industrial' }
  ];

  grids: modu[] = [
    { id: 'on-grid', title: 'On-Grid' },
    { id: 'off-grid', title: 'Off-Grid' }
  ];

  powers: modu[] = [
    { id: 'yes', title: 'Yes' },
    { id: 'no', title: 'No' }
  ];

  today = new Date().toISOString().split('T')[0];
  districts: DistrictResults[][] = [];
  searchTerm = '';
  editId: number | null = null;
  editIdops: number | null = null;
  form: FormGroup;
  formOps: FormGroup;
  private searchSubject = new Subject<string>();
  private subscription: Subscription;

  agencyDSearchTerm = '';
  selectedIPPStatsDetails: IPPStatsDetails | null = null;
  regionSearchTerm = '';

  ippstats: any[] = [];

  selectedFiles: File[] = [];
  selectedDocuments: Document[] = [];
  selectedFileUrl: string | null = null;
  private sanitizer = inject(DomSanitizer);

  constructor() {}

  ngOnInit() {
    this.GetAutofillData();
    this.form = this.fb.group({
      reporting_entity: [null, Validators.required],
      name: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', [Validators.required]],
      reporter: [''],
      reporting_date: ['', Validators.required],
      financial_year: [null, Validators.required],
      reported_by: ['', Validators.required],
      reporting_period: [null, Validators.required],
      rows: this.fb.array([this.createRow()])
    });
    this.form.get('financial_year')?.disable();
    this.form.get('reporting_period')?.disable();
    this.form.get('reporting_entity')?.disable();
    this.form.get('email')?.disable();
    this.form.get('name')?.disable();
    this.form.get('phone')?.disable();
    this.form.get('reported_by')?.disable();
    this.form.get('reporter')?.disable();

    this.formOps = this.fb.group({
      rowsops: this.fb.array([this.createRowOps()])
    });

    // Listen for search input with debounce
    this.subscription = this.searchSubject.pipe(debounceTime(400)).subscribe((term) => {
      this.filterIPPStatsDetails = this.electricityService.filterElectricityIPP(
        this.filterIPPStatsDetails,
        term
      );
    });

    this.loadIPPStatsDetails();

    this.searchSubject
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((term) => this.electricityService.searchElectricityIPP(term))
      )
      .subscribe((data) => {
        this.filterIPPStatsDetails = data;
      });

    // Load initial governments (first page)
    this.agencyService.list().subscribe((data) => {
      this.agencies = data.results;
    });

    this.FinancialYearService.list().subscribe((data) => {
      this.finances = data.results;
    });

    this.techtypesService.listEnergySource().subscribe((data) => {
      this.energies = data.results;
    });

    // Debounced search
    this.agencyInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.agencyLoading = true)),
        switchMap((term) => this.agencyService.search(term).pipe(finalize(() => (this.agencyLoading = false))))
      )
      .subscribe((data) => {
        this.agencies = data.results;
      });

    // Load initial regions (first page)
    this.regionService.list().subscribe((data) => {
      this.regions = (data.results ?? []).filter(d => d.active);
    });

    // Debounced search
    this.regionInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.regionLoading = true)),
        switchMap((term) => this.regionService.search(term).pipe(finalize(() => (this.regionLoading = false))))
      )
      .subscribe((data) => {
        this.regions = (data.results ?? []).filter(d => d.active);
      });
  }

  toggleRow(id: number) {
    this.expandedRow = this.expandedRow === id ? null : id;
  }

  getFileName(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  }

  /** Create a new table row form group */
  createRow(): FormGroup {
    const group = this.fb.group({
      ipp_name: ['', Validators.required],
      license_number: ['', Validators.required],
      country_of_origin: ['', Validators.required],
      contact_information: ['', Validators.required],
      total_production_capacity: ['', Validators.required],
      energy_source: [null, Validators.required],
      commercial_operation_date: ['', Validators.required],
    });

    return group;
  }

  createRowOps(): FormGroup {
    const group = this.fb.group({
      ipp: ['', Validators.required],
      submission: [null, Validators.required],
      ipp_name: ['', Validators.required],
      project_name: ['', Validators.required],
      location: [null, Validators.required],
      installed_capacity_mw: ['', Validators.required],
      available_capacity_mw: ['', Validators.required],
      energy_source: [null, Validators.required],
      grid_connected: [null, Validators.required],
      power_purchase_agreement: [null, Validators.required],
      purchase_duration_years: ['', Validators.required],
      remarks: ['', Validators.required]
    });

    // Listen for submission value changes to populate ipp and ipp_name
    group.get('submission')?.valueChanges.subscribe((submissionId) => {
      if (!submissionId) {
        group.patchValue({
          ipp: null,
          ipp_name: null
        });
        return;
      }

      console.log('On Value Change :', submissionId);

      // Find selected submission from already loaded ippstats
      const submission = this.ippstats?.find(s => s.submission === submissionId);

      if (submission) {
        group.patchValue({
          ipp: submission.id,
          ipp_name: submission.ipp_name
        });
      }
    });

    return group;
  }

  get rows(): FormArray {
    return (this.form?.get('rows') as FormArray) ?? this.fb.array([]);
  }

  get rowsops(): FormArray {
    return (this.formOps?.get('rowsops') as FormArray) ?? this.fb.array([]);
  }

  DownloadFileFromApi() {
    const stats_id = 52;
    this.electricityService.downloadTemplate(stats_id).subscribe((response: any) => {
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'number-of-independent-power-producers-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  selectedStatsTemplate: any;
  selectedStats: any;

  GetAutofillData() {
    this.agencyService.list().subscribe((data) => {
      this.agencies = data.results;
    });

    this.FinancialYearService.list().subscribe((data) => {
      this.finances = data.results;
    });
    
    this.selectedStatsTemplate = 52;
    this.electricityService.autoPopulateSubmission(this.selectedStatsTemplate).subscribe((data) => {
      this.selectedStats = data;
      console.log('Autofill Data:', this.selectedStats);
    });
  }

  /** Add a new row */
  addRowops(): void {
    this.rowsops.push(this.createRowOps());
  }

  /** Delete a row by index */
  deleteRowops(index: number): void {
    if (this.rowsops.length > 1) {
      this.rowsops.removeAt(index);
    }
  }

  /** Add a new row */
  addRow(): void {
    this.rows.push(this.createRow());
  }

  /** Delete a row by index */
  deleteRow(index: number): void {
    if (this.rows.length > 1) {
      this.rows.removeAt(index);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  loadIPPStatsDetails(url?: string) {
    const request$ = url ? this.electricityService.getPage(url) : this.electricityService.listElectricityIPP();

    request$.subscribe({
      next: (data) => {
        this.filterIPPStatsDetails = data;
        this.IPPStatsDetails = data.results;
        // Flatten all elec_ipp_stats from all submissions
        this.ippstats = [];
        data.results.forEach(submission => {
          submission.elec_ipp_stats.forEach(stat => {
            this.ippstats.push({
              id: stat.id,
              submission: submission.id,
              ipp_name: stat.ipp_name,
              license_number: stat.license_number,
              country_of_origin: stat.country_of_origin,
              contact_information: stat.contact_information,
              total_production_capacity: stat.total_production_capacity,
              energy_source: stat.energy_source,
              commercial_operation_date: stat.commercial_operation_date
            });
          });
        });
      }
    });
  }

  // Next/Prev navigation
  goNext(): void {
    if (this.filterIPPStatsDetails.links.next) {
      this.loadIPPStatsDetails(this.filterIPPStatsDetails.links.next);
    }
  }

  goPrev() {
    if (this.filterIPPStatsDetails.links.previous) {
      this.loadIPPStatsDetails(this.filterIPPStatsDetails.links.previous);
    }
  }

  onFilesChanged(files: File[]) {
    this.selectedFiles = files;
  }

  handleDocumentsUpdate(updatedDocs: Document[]) {
    console.log('Documents updated:', updatedDocs);
    this.selectedDocuments = updatedDocs;
  }

  resetRows(): void {
    // Clear all rows
    while (this.rows.length !== 0) {
      this.rows.removeAt(0);
    }

    // Add one empty row back
    this.addRow();

    // Optionally reset the entire form state
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  resetRowsops(): void {
    // Clear all rows
    while (this.rowsops.length !== 0) {
      this.rowsops.removeAt(0);
    }

    // Add one empty row back
    this.addRowops();

    // Optionally reset the entire form state
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  onSelectIPPStatsDetails(agent: IPPStatsDetails) {
    this.selectedIPPStatsDetails = agent;
    this.editId = agent.id;

    this.rows.clear();
    this.tempDistrictIds = [];

    agent.elec_ipp_stats.forEach((loc, i) => {
      // Create and push row FIRST
      const row = this.createRow();
      this.rows.push(row);

      // Patch values
      row.patchValue({
        ipp_name: loc.ipp_name,
        license_number: loc.license_number,
        country_of_origin: loc.country_of_origin,
        contact_information: loc.contact_information,
        total_production_capacity: loc.total_production_capacity,
        energy_source: loc.energy_source,
        commercial_operation_date: loc.commercial_operation_date,
      });
    });

    // Patch the documents (using selectedDocuments for app-file-uploader)
    this.selectedDocuments = agent.elec_ipp_docs.map((doc) => ({
      id: doc.id,
      file_url: doc.file,
      name: doc.name,
      description: doc.description,
      file: null as any, // No actual File object, just metadata
      created: new Date(),
      modified: new Date()
    }));

    this.form.patchValue({
      reporting_entity: agent.reporting_entity,
      name: agent.contact_person?.split('(')[0]?.trim() ?? '',
      email: agent.contact_person?.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/)?.[0] ?? '',
      phone: agent.contact_person?.match(/(\+?\d{9,15})/)?.[0]?.replace(/^\+255/, '') ?? '',
      reporting_date: agent.reporting_date,
      financial_year: agent.financial_year,
      reported_by: agent.reported_by,
      reporting_period: agent.reporting_period
    });

    setTimeout(() => {
      this.form.updateValueAndValidity();
    });

    console.log('Form Data On Selection Stats :', this.form.value);
  }

  buildPayload() {
    const formValue = this.form.getRawValue();

    return {
      reporting_entity: formValue?.reporting_entity,
      contact_person: formValue?.name + ' ' + `(${formValue?.email}, +255${formValue.phone})`,
      financial_year: formValue?.financial_year,
      reporting_date: formValue?.reporting_date,
      reported_by: formValue?.reported_by,
      reporting_period: formValue?.reporting_period,
      elec_ipp_stats: formValue.rows.flatMap((row: any) => ({
        ipp_name: row.ipp_name,
        license_number: row.license_number,
        country_of_origin: row.country_of_origin,
        contact_information: row.contact_information,
        total_production_capacity: row.total_production_capacity,
        energy_source: row.energy_source,
        commercial_operation_date: row.commercial_operation_date,
      })),
      elec_ipp_docs: this.selectedDocuments
    };
  }

  buildPayloadOpsData() {
    const formValue = this.formOps.getRawValue();

    return {
      reporting_entity: formValue?.reporting_entity,
      ipp: formValue?.ipp,
      submission: formValue?.submission,
      ipp_name: formValue?.ipp_name,
      project_name: formValue?.project_name,
      location: formValue?.location,
      installed_capacity_mw: formValue?.installed_capacity_mw,
      available_capacity_mw: formValue?.available_capacity_mw,
      energy_source: formValue?.energy_source,
      grid_connected: formValue?.grid_connected,
      power_purchase_agreement: formValue?.power_purchase_agreement,
      purchase_duration_years: formValue?.purchase_duration_years,
      remarks: formValue?.remarks,
    };
  }

  buildFormData(payload: any): FormData {
    const formData = new FormData();

    // Append simple fields
    Object.keys(payload).forEach((key) => {
      if (Array.isArray(payload[key])) return; // handled below
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    // Append elec_ipp_stats[]
    payload.elec_ipp_stats.forEach((loc: any, index: number) => {
      formData.append(`elec_ipp_stats[${index}]ipp_name`, loc.ipp_name);
      formData.append(`elec_ipp_stats[${index}]license_number`, loc.license_number);
      formData.append(`elec_ipp_stats[${index}]country_of_origin`, loc.country_of_origin);
      formData.append(`elec_ipp_stats[${index}]contact_information`, loc.contact_information);
      formData.append(`elec_ipp_stats[${index}]total_production_capacity`, loc.total_production_capacity);
      formData.append(`elec_ipp_stats[${index}]energy_source`, loc.energy_source);
      formData.append(`elec_ipp_stats[${index}]commercial_operation_date`, loc.commercial_operation_date);
    });

    // Append selected documents
    this.selectedDocuments.forEach((file: any, index: number) => {
      formData.append(`elec_ipp_docs[${index}]file`, file.file); // binary
      formData.append(`elec_ipp_docs[${index}]name`, file.name);
      formData.append(`elec_ipp_docs[${index}]description`, file.description || '');
    });

    return formData;
  }

  SubmitStats(item: IPPStatsDetails) {
    this.electricityService.submitElectricityIPP(item?.id).subscribe({
      next: (data) => {
        console.log('Submission Data Response: ', data);
        this.onReset();
        this.loadIPPStatsDetails();
        this.alertService.showNotification(
          'success',
          'Submit Statistics',
          `${data.submission_status} - Statistic Submission has been Submitted for Approval.`
        );
      }
    });
  }

  deleteDocument(submissionId: number, documentId: number) {
    if (!submissionId || !documentId) return;
    this.electricityService.deleteElectricityIPPDoc(submissionId, documentId).subscribe({
      next: () => {
        this.loadIPPStatsDetails();
        this.alertService.showNotification('success', 'Deleted', 'Document deleted successfully.');
        // Refresh the selected Electricity Access to reflect the deleted document
        if (this.selectedIPPStatsDetails) {
          this.onSelectIPPStatsDetails(this.selectedIPPStatsDetails);
        }
      }
    });
  }

  // Function to open Add Document Modal
  addDocumentModal(itemId: number) {
    // Reset selected files and documents
    this.selectedFiles = [];
    this.selectedDocuments = [];
    this.editId = itemId;
    // Open the modal
    const modalElement = document.getElementById('addDocumentModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  addIPPOpsDataModal(itemId: number) {
    // Reset selected files and documents
    this.selectedFiles = [];
    this.selectedDocuments = [];
    this.editId = itemId;
    // Open the modal
    const modalElement = document.getElementById('addIPPOpsDataModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  addUploadModal() {
    const modalElement = document.getElementById('addSubmissionUploadModal');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
    }
  }

  // Upload Submission
  uploadSubmission() {
    const payload = this.buildUploadPayload();
    console.log('Payload: ', payload);
    const formData = new FormData();

    // Append simple fields
    Object.keys(payload).forEach((key) => {
      if (Array.isArray(payload[key])) return; // handled below
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    // Append selected documents
    this.selectedDocuments.forEach((file: any, index: number) => {
      formData.append(`elec_ipp_stats_upload[${index}]file`, file.file); // binary
    });

    this.electricityService.createElectricityIPP(formData).subscribe({
      next: () => {
        this.onReset();
        this.loadIPPStatsDetails();
        this.alertService.showNotification('success', 'Uploaded', 'Submission uploaded successfully.');
        this.dissmissModal('addSubmissionUploadModal');
      }
    });
  }

  // Function to save document from modal saveNewDocument
  saveNewDocument() {
    if (this.editId === null) return;
    const document: Document = {
      id: 0,
      file_url: '',
      created: new Date(),
      modified: new Date(),
      name: this.selectedFiles[0]?.name || 'Unnamed Document',
      file: this.selectedFiles[0],
      description: this.selectedDocuments[0]?.description || ''
    };
    this.addDocumentToStatistic(this.editId, document);
    this.dissmissModal('addDocumentModal');
  }

  buildUploadPayload() {
    this.GetAutofillData();
    const formValue = this.form.getRawValue();

    return {
      reporting_entity: formValue?.reporting_entity,
      contact_person: formValue?.name + ' ' + `(${formValue?.email}, +255${formValue.phone})`,
      financial_year: formValue?.financial_year,
      reporting_date: formValue?.reporting_date,
      reported_by: formValue?.reported_by,
      reporting_period: formValue?.reporting_period,
      stats_id: 52
    };
  }

  dissmissModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = Modal.getInstance(modalElement);
      modal?.hide();
    }
  }

  // Add new Document to an existing statistic
  addDocumentToStatistic(submissionId: number, document: Document) {
    if (!submissionId || !document) return;
    const formData = new FormData();
    this.selectedDocuments.forEach((file: any) => {
      formData.append(`file`, file.file); // binary
      formData.append(`name`, file.name);
      formData.append(`description`, file.description || '');
    });

    this.electricityService.addElectricityIPPDoc(submissionId, formData).subscribe({
      next: () => {
        this.selectedFiles = [];
        this.selectedDocuments = [];
        this.selectedFiles = [];
        this.loadIPPStatsDetails();
        this.alertService.showNotification('success', 'Added', 'Document added successfully.');
        // Refresh the selected Carbon Emmission to reflect the new document
        if (this.selectedIPPStatsDetails) {
          this.onSelectIPPStatsDetails(this.selectedIPPStatsDetails);
        }
      }
    });
  }

  // CRUD actions for Stats
  onSubmit(action: 'create' | 'update' | 'delete') {
    if (this.form.invalid && action !== 'delete') return;
    console.log('Form Data - :', this.form.value);

    const jsonPayload = this.buildPayload();
    const formData = this.buildFormData(jsonPayload);

    console.log('Build-PayLoad - ', this.buildPayload());
    if (action === 'create') {
      this.electricityService.createElectricityIPP(formData).subscribe({
        next: () => {
          this.onReset();
          this.loadIPPStatsDetails();
          this.alertService.showNotification('success', 'Created', `Electricity IPP is created successfully.`);
        }
      });
    }
    if (action === 'update' && this.editId !== null) {
      this.electricityService.updateElectricityIPP(this.editId, formData).subscribe({
        next: () => {
          this.onReset();
          this.loadIPPStatsDetails();
          this.alertService.showNotification('success', 'Update', ` Electricity IPP is updated successfully.`);
        }
      });
    }
    if (action === 'delete' && this.editId !== null) {
      this.electricityService.removeElectricityIPP(this.editId).subscribe({
        next: () => {
          this.onReset();
          this.loadIPPStatsDetails();
          this.alertService.showNotification('success', 'Deleted', ` Electricity IPP is deleted successfully.`);
        }
      });
    }
  }

  // CRUD actions for Ops Data
  onSubmitOps(action: 'create' | 'update' | 'delete') {
    if (this.formOps.invalid && action !== 'delete') return;
    console.log('FormOps Data - :', this.formOps.value);

    const jsonPayload = this.buildPayloadOpsData();
    console.log('Build-PayLoad For Stats Ops Data - ', jsonPayload);

    // Here you would implement the actual API call for operations data
    // For now, just show a success message
    this.alertService.showNotification('success', 'Success', 'Operations data saved successfully.');
    this.dissmissModal('addIPPOpsDataModal');
    this.resetRowsops();
  }

  onResetForm() {
    this.formOps.reset();
    this.editId = null;
    this.resetRows();
    this.resetRowsops();
    this.form.reset({ active: true });
    this.editId = null;
    this.selectedIPPStatsDetails = null;
    this.selectedDocuments = [];
    this.selectedFiles = [];
  }

  // Reset form
  onReset() {
    this.form.reset();
    this.formOps.reset();
    this.editId = null;
    this.resetRows();
    this.resetRowsops();
    this.selectedIPPStatsDetails = null;
    this.selectedDocuments = [];
    this.selectedFiles = [];
  }
}