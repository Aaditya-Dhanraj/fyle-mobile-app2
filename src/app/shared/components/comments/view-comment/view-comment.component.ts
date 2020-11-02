import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IonContent, ModalController } from '@ionic/angular';
import { forkJoin, from, Observable, Subject } from 'rxjs';
import { finalize, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { ExtendedStatus } from 'src/app/core/models/extended_status.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { StatusService } from 'src/app/core/services/status.service';


@Component({
  selector: 'app-view-comment',
  templateUrl: './view-comment.component.html',
  styleUrls: ['./view-comment.component.scss'],
})
export class ViewCommentComponent implements OnInit {

  @Input() objectType: string;
  @Input() objectId: any;
  @Input() mode: string;

  @ViewChild('title') title: ElementRef;

  estatuses$: Observable<ExtendedStatus[]>;
  totalCommentsCount$: Observable<number>;
  showBotComments: Boolean;
  newComment: string;
  refreshEstatuses$: Subject<void> = new Subject();
  isCommentAdded: Boolean;
  
  constructor(
    private statusService: StatusService,
    private authService: AuthService,
    private modalController: ModalController
  ) { }

  changeBotComments() {
    this.showBotComments = !this.showBotComments
  }

  addComment() {

    if(this.newComment) {
      const data = {
        comment: this.newComment
      }

      this.newComment = null;
      this.isCommentAdded = true;

      this.statusService.post(this.objectType, this.objectId, data).pipe(
      ).subscribe(res=> {
        this.refreshEstatuses$.next();
      });

    }
  }

  closeCommentModal() {

    if(this.isCommentAdded) {
      // Todo: Track Add Comment Event
      // TrackingService.addComment({Asset: 'Mobile'});
    } else {
      // Todo: Track View Comment Event
      // TrackingService.viewComment({Asset: 'Mobile'});
    }
    this.modalController.dismiss();
  }

  ngOnInit() {
    this.showBotComments = false;
    const eou$ = from(this.authService.getEou());

    this.estatuses$ = this.refreshEstatuses$.pipe(
      startWith(0),
      switchMap(() => {
        return eou$;
      }),
      switchMap(eou => {
        return this.statusService.find(this.objectType, this.objectId).pipe(
          map(res => {
            return res.map(status => {
              status.isBotComment = status && status.st && (status.st.org_user_id === 'SYSTEM');
              status.isSelfComment = status && status.st && eou && eou.ou && (status.st.org_user_id === eou.ou.id);
              return status;
            })
          }), map(res => {
            return res.sort(function(a,b){
              return a.st.created_at - b.st.created_at;
            });
          }),finalize(() => {
            setTimeout(() => {
              this.title.nativeElement.scrollToBottom();
            }, 500);
          })
        )
      })
    )

    this.totalCommentsCount$ = this.estatuses$.pipe(
      map(res => {
        return res.filter(function (estatus) {
          return estatus.st.org_user_id !== 'SYSTEM';
        }).length;
      })
    )

  }

}
