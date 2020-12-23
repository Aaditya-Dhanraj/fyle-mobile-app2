import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ModalController} from '@ionic/angular';

@Component({
  selector: 'app-corporate-card-expenses-sort-filter',
  templateUrl: './corporate-card-expenses-sort-filter.component.html',
  styleUrls: ['./corporate-card-expenses-sort-filter.component.scss'],
})
export class CorporateCardExpensesSortFilterComponent implements OnInit {
  @Input() filters: Partial<{
    date: string;
    customDateStart: Date;
    customDateEnd: Date;
    sortParam: string;
    sortDir: string;
  }>;

  fg: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.fg = this.fb.group({
      sortParam: [
        this.filters && this.filters.sortParam || 'txn_dt', Validators.required
      ],
      sortDir: [
        this.filters && this.filters.sortDir || 'desc', Validators.required
      ]
    });
  }

  reset() {
    this.fg.setValue({
      sortParam: 'txn_dt',
      sortDir: 'desc'
    });
  }

  save() {
    this.modalController.dismiss({
      sortOptions: this.fg.value
    });
  }

  cancel() {
    this.modalController.dismiss();
  }

  clearAll() {
    this.fg.reset();
  }
}
