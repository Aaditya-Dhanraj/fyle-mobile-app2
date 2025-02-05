import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { FilterPill } from './filter-pill.interface';

@Component({
  selector: 'app-fy-filter-pills',
  templateUrl: './fy-filter-pills.component.html',
  styleUrls: ['./fy-filter-pills.component.scss'],
})
export class FyFilterPillsComponent implements OnInit {
  @Input() filterPills: FilterPill[];

  @Output() clearAll = new EventEmitter();

  @Output() filterClicked = new EventEmitter();

  @Output() filterClose = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  onClearAll() {
    this.clearAll.emit();
  }

  onFilterClick(filterPill: FilterPill) {
    this.filterClicked.emit(filterPill.type);
  }

  onFilterClose(event: Event, filterPill: FilterPill) {
    event.stopPropagation();
    this.filterClose.emit(filterPill.type);
  }
}
