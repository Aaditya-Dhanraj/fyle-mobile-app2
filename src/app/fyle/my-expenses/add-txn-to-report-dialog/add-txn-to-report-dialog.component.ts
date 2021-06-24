import { Component, OnInit, Input, Inject } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import { Observable, from, noop } from 'rxjs';
import { ExtendedReport } from 'src/app/core/models/report.model';
import { ReportService } from 'src/app/core/services/report.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { switchMap, finalize, tap, map } from 'rxjs/operators';
import { getCurrencySymbol } from '@angular/common';
import { OfflineService } from 'src/app/core/services/offline.service';
import { MatBottomSheet, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-add-txn-to-report-dialog',
  templateUrl: './add-txn-to-report-dialog.component.html',
  styleUrls: ['./add-txn-to-report-dialog.component.scss'],
})
export class AddTxnToReportDialogComponent implements OnInit {

  @Input() txId;
  @Input() openReports;
  approverPendingReports$: Observable<any>;
  reportCurrencySymbol: string;



  constructor(
    private modalController: ModalController,
    private reportService: ReportService,
    private loaderService: LoaderService,
    private offlineService: OfflineService,
    private popoverController: PopoverController,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private matBottomsheet: MatBottomSheet
  ) { }

  closeAddToReportModal() {
    //this.popoverController.dismiss();
    this.matBottomsheet.dismiss();
  }

  addTransactionToReport(report) {
    // from(this.loaderService.showLoader('Adding transaction to report')).pipe(
    //   switchMap(() => {
    //     return this.reportService.addTransactions(reportId, [this.txId]);
    //   }),
    //   finalize(() => this.loaderService.hideLoader())
    // ).subscribe(() => {
    //   this.modalController.dismiss({reload: true});
    // });
    //this.popoverController.dismiss({report});
    this.matBottomsheet.dismiss({report});
  }

  ngOnInit() {
    console.log("----------");
    console.log(this.data.openReports);
    // const queryParams = { rp_state: 'in.(DRAFT,APPROVER_PENDING)' };
    // this.approverPendingReports$ = from(this.loaderService.showLoader('Loading Reports')).pipe(
    //   switchMap(() => {
    //     return this.reportService.getAllExtendedReports({
    //       queryParams
    //     });
    //   }),
    //   finalize(() => this.loaderService.hideLoader())
    // );

    this.offlineService.getHomeCurrency().pipe(
      map((homeCurrency) => {
        this.reportCurrencySymbol = getCurrencySymbol(homeCurrency, 'wide');
      })
    ).subscribe(noop);
  }

}
