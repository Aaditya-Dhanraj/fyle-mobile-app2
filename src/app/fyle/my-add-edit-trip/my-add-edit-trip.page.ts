import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { from, Observable, noop, forkJoin, of, concat, combineLatest, iif, Subject } from 'rxjs';
import { ExtendedOrgUser } from 'src/app/core/models/extended-org-user.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DateService } from 'src/app/core/services/date.service';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators } from '@angular/forms';
import { map, tap, mergeMap, startWith, concatMap, finalize, shareReplay, switchMap, take, concatMapTo } from 'rxjs/operators';
import * as moment from 'moment';
import { OrgUserService } from 'src/app/core/services/org-user.service';
import { ModalController, PopoverController } from '@ionic/angular';
import { OtherRequestsComponent } from './other-requests/other-requests.component';
import { CustomInputsService } from 'src/app/core/services/custom-inputs.service';
import { CustomFieldsService } from 'src/app/core/services/custom-fields.service';
import { TripRequestCustomFieldsService } from 'src/app/core/services/trip-request-custom-fields.service';
import { OfflineService } from 'src/app/core/services/offline.service';
import { TripRequestsService } from 'src/app/core/services/trip-requests.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { SavePopoverComponent } from './save-popover/save-popover.component';
import { CustomField } from 'src/app/core/models/custom_field.model';
import { ProjectsService } from 'src/app/core/services/projects.service';

@Component({
  selector: 'app-my-add-edit-trip',
  templateUrl: './my-add-edit-trip.page.html',
  styleUrls: ['./my-add-edit-trip.page.scss'],
})
export class MyAddEditTripPage implements OnInit {

  // allowedProjectIds$: Observable<any>;
  eou$: Observable<ExtendedOrgUser>;
  tripTypes = [];
  tripDate;
  hotelDate;
  tripActions;
  mode;
  minDate;
  maxDate;
  today;
  isTripTypeMultiCity$: Observable<boolean>;
  isTripTypeOneWay$: Observable<boolean>;
  isTransportationRequested$: Observable<boolean>;
  isHotelRequested$: Observable<boolean>;
  isAdvanceRequested$: Observable<boolean>;
  travelAgents$: Observable<any>;
  customFields$: Observable<any>;
  isProjectsEnabled$: Observable<boolean>;
  projects$: Observable<[]>;
  tripRequest$: Observable<any>;
  customFieldValues;
  refreshTrips$ = new Subject();

  constructor(
    private router: Router,
    private authService: AuthService,
    private dateService: DateService,
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private orgUserService: OrgUserService,
    private modalController: ModalController,
    private tripRequestCustomFieldsService: TripRequestCustomFieldsService,
    private offlineService: OfflineService,
    private tripRequestsService: TripRequestsService,
    private loaderService: LoaderService,
    private popoverController: PopoverController,
    private projectsService: ProjectsService
  ) { }

  fg: FormGroup;

  async goBack() {
    const addExpensePopover = await this.popoverController.create({
      component: SavePopoverComponent,
      componentProps: {
        saveMode: 'CLOSE',
      },
      cssClass: 'dialog-popover'
    });
    await addExpensePopover.present();
    const { data } = await addExpensePopover.onDidDismiss();
    if (data && data.continue) {
      this.router.navigate(['/', 'enterprise', 'my_trips']);
    }
  }

  setTripRequestObject(name, mobile) {
    const intialTraveler = this.formBuilder.group({
      name: [name],
      phone_number: [mobile]
    });
    this.travellerDetails.push(intialTraveler);
  }

  removeTraveller(i) {
    this.travellerDetails.removeAt(i);
  }

  removeCity(i) {
    this.cities.removeAt(i);
  }

  addNewTraveller() {
    const intialTraveler = this.formBuilder.group({
      name: [null],
      phone_number: [null]
    });
    this.travellerDetails.push(intialTraveler);
  }

  get travellerDetails() {
    return this.fg.get('travellerDetails') as FormArray;
  }

  async onSubmit() {
    const addExpensePopover = await this.popoverController.create({
      component: SavePopoverComponent,
      componentProps: {
        saveMode: 'SUBMIT',
        otherRequests: [
          { hotel: this.fg.get('hotelRequest').value || false },
          { transportation: this.fg.get('transportationRequest').value || false }
        ]
      },
      cssClass: 'dialog-popover'
    });

    if (this.fg.valid) {
      if (!(this.fg.controls.endDate.value >= this.fg.controls.startDate.value)) {
        this.fg.markAllAsTouched();
        return;
      } else {
        await addExpensePopover.present();
        const { data } = await addExpensePopover.onDidDismiss();
        if (data && data.continue) {
          this.customFields$.pipe(
            take(1)
          ).subscribe(customFields => {
            this.fg.value.custom_field_values = customFields.map(field => {
              return field.control.value;
            });
            this.submitTripRequest(this.fg.value);
          });
        }
      }
    } else {
      this.fg.markAllAsTouched();
    }
  }

  async saveDraftModal() {
    const addExpensePopover = await this.popoverController.create({
      component: SavePopoverComponent,
      componentProps: {
        saveMode: 'DRAFT'
      },
      cssClass: 'dialog-popover'
    });

    if (this.fg.valid) {
      if (!(this.fg.controls.endDate.value >= this.fg.controls.startDate.value)) {
        this.fg.markAllAsTouched();
        return;
      } else {
        await addExpensePopover.present();
        const { data } = await addExpensePopover.onDidDismiss();
        if (data && data.continue) {
          this.saveAsDraft(this.fg.value);
        }
      }
    } else {
      this.fg.markAllAsTouched();
    }
  }

  saveAsDraft(formValue) {
    from(this.loaderService.showLoader('Saving as draft')).pipe(
      switchMap(() => {
        return this.makeTrpfromFormFg(formValue);
      }),
      switchMap(res => {
        return this.tripRequestsService.saveDraft(res);
      }),
      switchMap(res => {
        return this.tripRequestsService.triggerPolicyCheck(res.id);
      }),
      finalize(() => {
        this.loaderService.hideLoader();
        this.fg.reset();
        this.router.navigate(['/', 'enterprise', 'my_trips']);
      })
    ).subscribe(noop);
  }

  makeTrpfromFormFg(formValue) {
    if (this.mode === 'edit') {
      return forkJoin({
        tripRequest: this.tripRequest$
      }).pipe(
        map(res => {
          const tripRequest: any = res.tripRequest;
          const trp = {
            ...tripRequest,
            custom_field_values: formValue.custom_field_values,
            end_dt: formValue.endDate,
            notes: formValue.notes,
            project_id: formValue.project && formValue.project.project_id || null,
            purpose: formValue.purpose,
            source: formValue.source,
            start_dt: formValue.startDate,
            traveller_details: formValue.travellerDetails,
            trip_cities: formValue.cities,
            trip_type: formValue.tripType
          };
          return trp;
        })
      );
    } else {
      const trp = {
        custom_field_values: formValue.custom_field_values,
        end_dt: formValue.endDate,
        notes: formValue.notes,
        project_id: formValue.project && formValue.project.project_id || null,
        purpose: formValue.purpose,
        source: formValue.source,
        start_dt: formValue.startDate,
        traveller_details: formValue.travellerDetails,
        trip_cities: formValue.cities,
        trip_type: formValue.tripType
      };
      return of(trp);
    }
  }

  submitTripRequest(formValue) {
    from(this.loaderService.showLoader('Submitting Trip Request')).pipe(
      switchMap(() => {
        return this.makeTrpfromFormFg(formValue);
      }),
      switchMap(res => {
        return this.tripRequestsService.submit(res);
      }),
      switchMap(res => {
        return this.tripRequestsService.triggerPolicyCheck(res.id);
      }),
      finalize(() => {
        this.loaderService.hideLoader();
        this.fg.reset();
        this.router.navigate(['/', 'enterprise', 'my_trips']);
      })
    ).subscribe(noop);

  }

  get startDate() {
    return this.fg.get('startDate') as FormControl;
  }

  get endDate() {
    return this.fg.get('endDate') as FormControl;
  }

  setDefaultStarrtDate() {
    this.today = new Date();
    this.startDate.setValue(moment(this.today).format('y-MM-DD'));
  }

  get cities() {
    return this.fg.get('cities') as FormArray;
  }

  get tripType() {
    return this.fg.get('tripType').value;
  }

  addDefaultCity() {
    let toCity;
    if (this.cities.value.length >= 1) {
      toCity = this.cities.controls[this.cities.value.length - 1].value.to_city;
      this.minDate = this.cities.controls[this.cities.value.length - 1].value.onward_dt;
    }

    const intialCity = this.formBuilder.group({
      from_city: [toCity, Validators.required],
      to_city: [null, Validators.required],
      onward_dt: [null, Validators.required]
    });

    if (this.fg.controls.tripType.value === 'ROUND') {
      intialCity.addControl('return_date', new FormControl('', Validators.required));
    }
    this.cities.push(intialCity);
  }

  addNewCity() {
    this.addDefaultCity();
  }

  intializeDefaults() {
    this.setDefaultStarrtDate();
    this.addDefaultCity();
  }

  async openModal() {

    const modal = await this.modalController.create({
      component: OtherRequestsComponent,
      componentProps: {
        otherRequests: [
          { hotel: this.fg.get('hotelRequest').value || false },
          { advance: this.fg.get('advanceRequest').value || false },
          { transportation: this.fg.get('transportationRequest').value || false }
        ],
        fgValues: this.fg.value,
        id: this.activatedRoute.snapshot.params.id || null
      }
    });

    if (this.fg.valid) {
      if (!(this.fg.controls.endDate.value >= this.fg.controls.startDate.value)) {
        this.fg.markAllAsTouched();
        return;
      } else {
        return await modal.present();
      }
    } else {
      this.fg.markAllAsTouched();
    }
  }

  modifyTripRequestCustomFields(customFields): CustomField[] {
    customFields.sort((a, b) => (a.id > b.id) ? 1 : -1);
    customFields = customFields.map(customField => {
      if (customField.type === 'DATE' && customField.value) {
        const updatedDate = new Date(customField.value);
        customField.value = updatedDate.getFullYear() + '-' + (updatedDate.getMonth() + 1) + '-' + updatedDate.getDate();
      }
      return {id: customField.id, name: customField.name, value: customField.value};
    });
    this.customFieldValues = customFields;
    return this.customFieldValues;
  }

  ngOnInit() {

    const id = this.activatedRoute.snapshot.params.id;
    const orgSettings$ = this.offlineService.getOrgSettings();
    this.customFieldValues = [];

    this.tripTypes = [
      {
        value: 'ONE_WAY',
        label: 'One Way'
      }, {
        value: 'ROUND',
        label: 'Round Trip'
      }, {
        value: 'MULTI_CITY',
        label: 'Multi City'
      }
    ];

    // TODO use formBuilder.group
    this.minDate = moment(new Date()).format('y-MM-DD');

    this.fg = new FormGroup({
      travellerDetails: new FormArray([]),
      tripType: new FormControl('ONE_WAY', [Validators.required]),
      startDate: new FormControl('', [Validators.required]),
      endDate: new FormControl('', [Validators.required]),
      purpose: new FormControl('', [Validators.required]),
      cities: new FormArray([]),
      project: new FormControl('', []),
      travelAgent: new FormControl('', []),
      notes: new FormControl('', []),
      transportationRequest: new FormControl('', []),
      hotelRequest: new FormControl('', []),
      advanceRequest: new FormControl('', []),
      source: new FormControl('MOBILE', []),
      custom_field_values: new FormArray([])
    });

    this.maxDate = this.fg.controls.endDate.value;

    this.customFields$ = this.tripRequestCustomFieldsService.getAll().pipe(
      map((customFields: any[]) => {
        const customFieldsFormArray = this.fg.controls.custom_field_values as FormArray;
        customFieldsFormArray.clear();

        customFields.sort((a, b) => (a.id > b.id) ? 1 : -1);

        customFields = customFields.filter(field => {
          return field.request_type === 'TRIP_REQUEST' && field.trip_type.indexOf(this.fg.get('tripType').value) > -1;
        });

        for (const customField of customFields) {
          let value;
          this.customFieldValues.filter(customFieldValue => {
            if (customFieldValue.id === customField.id) {
              value = customFieldValue.value;
            }
          });
          customFieldsFormArray.push(
            this.formBuilder.group({
              id: customField.id,
              name: customField.input_name,
              value: [value, customField.mandatory && Validators.required]
            })
          );
        }

        return customFields.map((customField, i) => {
          customField.control = customFieldsFormArray.at(i);

          if (customField.input_options) {
            customField.options = customField.input_options.map(option => {
              return { label: option, value: option };
            });
          }
          return customField;
        });
      }),
      shareReplay(1)
    );

    this.intializeDefaults();

    if (id) {
      this.mode = 'edit';

      this.tripRequest$ = this.tripRequestsService.get(id);
      const selectedProject$ = this.tripRequest$.pipe(
        switchMap(trip => {
          return iif(() => trip.project_id, this.projectsService.getbyId(trip.project_id), of(null));
        })
      );

      from(this.loaderService.showLoader('Getting trip details')).pipe(
        switchMap(() => {
          return combineLatest([
            this.tripRequest$,
            selectedProject$,
            this.tripRequestsService.getHotelRequests(id),
            this.tripRequestsService.getTransportationRequests(id),
            this.tripRequestsService.getAdvanceRequests(id),
          ]);
        }),
        take(1),
        map(([tripRequest, selectedProject, hotelRequest, transportRequest, advanceRequest]) => {

          tripRequest.traveller_details.forEach(traveller => {
            this.setTripRequestObject(traveller.name, traveller.phone_number);
          });
          this.fg.get('tripType').setValue(tripRequest.trip_type);
          this.fg.get('startDate').setValue(moment(tripRequest.start_date).format('y-MM-DD'));
          this.fg.get('endDate').setValue(moment(tripRequest.end_date).format('y-MM-DD'));
          this.fg.get('purpose').setValue(tripRequest.purpose);
          this.fg.get('project').setValue(selectedProject);
          this.fg.get('travelAgent').setValue((transportRequest[0] && transportRequest[0].tr.assigned_to) || null);
          this.fg.get('notes').setValue(tripRequest.notes);
          this.fg.get('source').setValue(tripRequest.source);

          this.fg.get('custom_field_values').setValue(this.modifyTripRequestCustomFields(tripRequest.custom_field_values));
          const custom = this.fg.get('custom_field_values') as FormArray;
          custom.clear();
          const renderedCustomFeild = this.modifyTripRequestCustomFields(tripRequest.custom_field_values);
          renderedCustomFeild.forEach(field => {
            const customFields = this.formBuilder.group({
              id: [field.id],
              name: [field.name],
              value: [field.value]
            });
            custom.push(customFields);
          });


          this.cities.clear();
          tripRequest.trip_cities.forEach(tripCity => {
            const intialCity = this.formBuilder.group({
              from_city: [tripCity.from_city, Validators.required],
              to_city: [tripCity.to_city, Validators.required],
              onward_dt: [moment(tripCity.onward_dt).format('y-MM-DD'), Validators.required]
            });

            if (this.fg.controls.tripType.value === 'ROUND') {
              intialCity.addControl('return_date', new FormControl(moment(tripCity.return_dt).format('y-MM-DD'), Validators.required));
            }
            this.cities.push(intialCity);
          });

          this.fg.get('transportationRequest').setValue(transportRequest.length > 0 ? true : false);
          this.fg.get('hotelRequest').setValue(hotelRequest.length > 0 ? true : false);
          this.fg.get('advanceRequest').setValue(advanceRequest.length > 0 ? true : false);
        }),
        finalize(() => this.loaderService.hideLoader())
      ).subscribe(noop);
    } else {
      this.mode = 'add';
      this.tripActions = {
        can_save: true,
        can_submit: true
      };
    }

    this.eou$ = from(this.authService.getEou());
    this.travelAgents$ = this.orgUserService.getAllCompanyEouc().pipe(
      map(eous => {
        let travelAgents = [];
        eous.filter(eou => {
          if (eou.ou.roles.indexOf('TRAVEL_AGENT') > -1) {
            travelAgents.push({
              label: eou.us.full_name + '(' + eou.us.email + ')',
              value: eou.ou.id
            });
          }
        });
        return travelAgents;
      })
    );

    if (this.mode === 'edit') {

    } else if (this.mode === 'add') {
      this.eou$.subscribe(res => {
        this.setTripRequestObject(res.us.full_name, res.ou.mobile);
      });
    }

    this.isTripTypeMultiCity$ = this.fg.controls.tripType.valueChanges.pipe(
      map(res => res === 'MULTI_CITY')
    );

    this.isTripTypeOneWay$ = this.fg.controls.tripType.valueChanges.pipe(
      map(res => res === 'ONE_WAY')
    );

    this.isTripTypeMultiCity$.subscribe(isMulticity => {
      if (isMulticity) {
        this.addDefaultCity();
      } else {
        const firstCity = this.cities.at(0);
        this.cities.clear();
        this.cities.push(firstCity);
      }
    });

    this.isTripTypeOneWay$.subscribe(oneWay => {
      if (oneWay) {
        this.cities.clear();
        this.addDefaultCity();
      }
    });

    this.isTransportationRequested$ = this.fg.controls.transportationRequest.valueChanges.pipe(
      map(res => {
        return res;
      })
    );

    this.isHotelRequested$ = this.fg.controls.hotelRequest.valueChanges.pipe(
      map(res => {
        return res;
      })
    );

    this.isAdvanceRequested$ = this.fg.controls.advanceRequest.valueChanges.pipe(
      map(res => {
        return res;
      })
    );

    this.isProjectsEnabled$ = orgSettings$.pipe(
      map(orgSettings => {
        return orgSettings.projects && orgSettings.projects.enabled;
      })
    );
    this.projects$ = this.offlineService.getProjects();

    this.fg.controls.tripType.valueChanges.subscribe(res => {
      if (res === 'ROUND') {
        const firstCity = this.cities.at(0);
        this.cities.clear();
        const intialCity = this.formBuilder.group({
          from_city: [firstCity.value.fromCity, Validators.required],
          to_city: [firstCity.value.toCity, Validators.required],
          onward_dt: [firstCity.value.onward_dt, Validators.required],
          return_date: [null, Validators.required]
        });
        this.cities.push(intialCity);
      }
    });

    this.fg.valueChanges.subscribe(formValue => {
      this.refreshTrips$.next();
      if (formValue.tripType === 'MULTI_CITY') {
        if (formValue.cities.length > 1) {
          this.minDate = formValue.cities[formValue.cities.length - 2].onward_dt;
        }
      }
    });
  }

}
