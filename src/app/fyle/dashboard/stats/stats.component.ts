import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DashboardService} from '../dashboard.service';
import {Observable} from 'rxjs/internal/Observable';
import {shareReplay} from 'rxjs/internal/operators/shareReplay';
import {delay, map, startWith, tap} from 'rxjs/operators';
import {CurrencyService} from '../../../core/services/currency.service';
import {Params, Router} from '@angular/router';
import {ActionSheetController} from '@ionic/angular';
import {NetworkService} from '../../../core/services/network.service';
import {concat, Subject} from 'rxjs';
import {ReportStates} from '../stat-badge/report-states';
import {OfflineService} from '../../../core/services/offline.service';
import {getCurrencySymbol} from '@angular/common';
import { TrackingService } from 'src/app/core/services/tracking.service';
import { BankAccountsAssigned } from 'src/app/core/models/v2/bank-accounts-assigned.model';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
})
export class StatsComponent implements OnInit {
  draftStats$: Observable<{ count: number; sum: number }>;

  reportedStats$: Observable<{ count: number; sum: number }>;

  approvedStats$: Observable<{ count: number; sum: number }>;

  paymentPendingStats$: Observable<{ count: number; sum: number }>;

  homeCurrency$: Observable<string>;

  isConnected$: Observable<boolean>;

  currencySymbol$: Observable<string>;

  unreportedExpensesCount$: Observable<{ count: number }>;

  unreportedExpensesAmount$: Observable<{ amount: number }>;

  actionSheetButtons = [];

  reportStatsLoading = true;

  loadData$ = new Subject();

  cardTransactionsAndDetails$: Observable<BankAccountsAssigned>;

  get ReportStates() {
    return ReportStates;
  }

  constructor(
      private dashboardService: DashboardService,
      private currencyService: CurrencyService,
      private router: Router,
      private actionSheetController: ActionSheetController,
      private offlineService: OfflineService,
      private networkService: NetworkService,
      private trackingService: TrackingService
  ) {
  }

  setupNetworkWatcher() {
    const networkWatcherEmitter = new EventEmitter<boolean>();
    this.networkService.connectivityWatcher(networkWatcherEmitter);
    this.isConnected$ = concat(this.networkService.isOnline(), networkWatcherEmitter.asObservable()).pipe(
      shareReplay(1)
    );
  }

  initializeReportStats() {
    this.reportStatsLoading = true;
    const reportStats$ = this.dashboardService.getReportsStats().pipe(
      tap(() => {
        this.reportStatsLoading = false;
      }),
      shareReplay(1)
    );

    this.draftStats$ = reportStats$.pipe(
      map(stats => stats.draft)
    );

    this.reportedStats$ = reportStats$.pipe(
      map(stats => stats.report)
    );

    this.approvedStats$ = reportStats$.pipe(
      map(stats => stats.approved)
    );

    this.paymentPendingStats$ = reportStats$.pipe(
      map(stats => stats.paymentPending)
    );
  }

  initializeExpensesStats() {
    const unreportedExpensesStats$ = this.dashboardService.getUnreportedExpensesStats().pipe(
      shareReplay(1)
    );

    this.unreportedExpensesCount$ = unreportedExpensesStats$.pipe(
      map(stats => ({ count: stats.totalCount }))
    );

    this.unreportedExpensesAmount$ = unreportedExpensesStats$.pipe(
      map(stats => ({ amount: stats.totalAmount }))
    );
  }

  initializeCCCStats() {
    this.cardTransactionsAndDetails$ = this.dashboardService.getCCCDetails().pipe(
      map(res => res[0]),
      shareReplay(1)
    );
  }

  /*
  * This is required because ionic dosnt reload the page every time we enter, it initializes via ngOnInit only on first entry.
  * The ionViewWillEnter is an alternative for this but not present in child pages.
  * Here, I am setting up the initialize method to be called from the parent's ionViewWillEnter method.
  * **/
  init() {
    const that = this;
    that.homeCurrency$ = that.currencyService.getHomeCurrency().pipe(
      shareReplay(1)
    );
    that.currencySymbol$ = that.homeCurrency$.pipe(
      map((homeCurrency: string) => getCurrencySymbol(homeCurrency, 'wide'))
    );

    that.initializeReportStats();
    that.initializeExpensesStats();
    that.offlineService.getOrgSettings().subscribe(orgSettings => {
      this.setupActionSheet(orgSettings);
      if (orgSettings.corporate_credit_card_settings.enabled) {
        that.initializeCCCStats();
      }
    });
  }

  setupActionSheet(orgSettings) {
    const that = this;
    const mileageEnabled = orgSettings.mileage.enabled;
    const isPerDiemEnabled = orgSettings.per_diem.enabled;
    that.actionSheetButtons = [{
      text: 'Capture Receipt',
      icon: 'assets/svg/fy-camera.svg',
      cssClass: 'capture-receipt',
      handler: () => {
        that.trackingService.dashboardActionSheetButtonClicked({
          Asset: 'Mobile',
          Action: 'Capture Receipt'
        });
        that.router.navigate(['/', 'enterprise', 'camera_overlay', {
          navigate_back: true
        }]);
      }
    }, {
      text: 'Add Manually',
      icon: 'assets/svg/fy-expense.svg',
      cssClass: 'capture-receipt',
      handler: () => {
        that.trackingService.dashboardActionSheetButtonClicked({
          Asset: 'Mobile',
          Action: 'Add Manually'
        });
        that.router.navigate(['/', 'enterprise', 'add_edit_expense',{
          navigate_back: true
        }]);
      }
    }];

    if (mileageEnabled) {
      this.actionSheetButtons.push({
        text: 'Add Mileage',
        icon: 'assets/svg/fy-mileage.svg',
        cssClass: 'capture-receipt',
        handler: () => {
          that.trackingService.dashboardActionSheetButtonClicked({
            Asset: 'Mobile',
            Action: 'Add Mileage'
          });
          that.router.navigate(['/', 'enterprise', 'add_edit_mileage',{
            navigate_back: true
          }]);
        }
      });
    }

    if (isPerDiemEnabled) {
      that.actionSheetButtons.push({
        text: 'Add Per Diem',
        icon: 'assets/svg/fy-calendar.svg',
        cssClass: 'capture-receipt',
        handler: () => {
          that.trackingService.dashboardActionSheetButtonClicked({
            Asset: 'Mobile',
            Action: 'Add Per Diem'
          });
          that.router.navigate(['/', 'enterprise', 'add_edit_per_diem',{
            navigate_back: true
          }]);
        }
      });
    }
  }

  ngOnInit() {
    this.homeCurrency$ = this.currencyService.getHomeCurrency().pipe(
      shareReplay(1)
    );
    this.setupNetworkWatcher();
  }

  goToReportsPage(state: ReportStates) {
    const queryParams: Params = {filters: JSON.stringify({state: state.toString()})};
    this.router.navigate(['/', 'enterprise', 'my_reports'], {
      queryParams
    });

    this.trackingService.dashboardOnReportPillClick({
      Asset: 'Mobile',
      State: state.toString()
    });
  }

  goToExpensesPage() {
    const queryParams: Params = {filters: JSON.stringify({state: ['READY_TO_REPORT']})};
    this.router.navigate(['/', 'enterprise', 'my_expenses'], {
      queryParams
    });

    this.trackingService.dashboardOnUnreportedExpensesClick({
      Asset: 'Mobile'
    });
  }

  goToCCCPage(state: string) {
    this.router.navigate(['/', 'enterprise', 'corporate_card_expenses', { pageState: state }]);
  }

  async openAddExpenseActionSheet() {
    const that = this;
    that.trackingService.dashboardActionSheetOpened({
      Asset: 'Mobile'
    });
    const actionSheet = await this.actionSheetController.create({
      header: 'ADD EXPENSE',
      mode: 'md',
      cssClass: 'fy-action-sheet',
      buttons: that.actionSheetButtons
    });
    await actionSheet.present();
  }
}
