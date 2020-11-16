import { Injectable } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { DateService } from '../core/services/date.service';
import { DataTransformService } from '../core/services/data-transform.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  constructor(
    private apiService: ApiService,
    private dataTransformService: DataTransformService,
    private dateService: DateService
  ) { }

  getStatusCategory(comment, type) {
    let statusCategory = {};
    const lowerCaseComment = comment && comment.toLowerCase();

    switch (true) {
      case (lowerCaseComment.indexOf('hotel request') > -1) || (lowerCaseComment.indexOf('transportation request') > -1):
        statusCategory = {
          category: 'Others',
          icon: 'fy-info-circle-o'
        };
        break;
      case (lowerCaseComment.indexOf('created') > -1 && lowerCaseComment.indexOf('reversal') > -1):
        statusCategory = {
          category: type + ' Reversed',
          icon: 'fy-info-circle-o'
        };
        break;
      case lowerCaseComment.indexOf('created') > -1:
        statusCategory = {
          category: type + ' Created',
          icon: 'fy-add-circle'
        };
        break;
      case lowerCaseComment.indexOf('updated') > -1:
        statusCategory = {
          category: type + ' Edited',
          icon: 'fy-edit-circle-o'
        };
        break;
      case lowerCaseComment.indexOf('attachment') > -1:
        statusCategory = {
          category: 'Receipt Attached',
          icon: 'fy-attachment-circle'
        };
        break;
      case lowerCaseComment.indexOf('report') > -1:
        statusCategory = {
          category: 'Report',
          icon: 'fy-report-circle'
        };
        break;
      case lowerCaseComment.indexOf('flagged') > -1:
        statusCategory = {
          category: 'Flagged',
          icon: 'fy-flag-circle-o'
        };
        break;
      case lowerCaseComment.indexOf('the following action(s) will be taken') > -1:
        statusCategory = {
          category: 'Policy Violation',
          icon: 'fy-exclamation-circle'
        };
        break;
      case lowerCaseComment.indexOf('additional approvers are not present') > -1:
        statusCategory = {
          category: 'Failed to run policies',
          icon: 'fy-exclamation-circle'
        };
        break;
      case lowerCaseComment.indexOf('verified') > -1:
        statusCategory = {
          category: 'Verified',
          icon: 'fy-verified-circle'
        };
        break;
      case lowerCaseComment.indexOf('approved') > -1:
        statusCategory = {
          category: type + ' Approved',
          icon: 'fy-check-circle-o'
        };
        break;
      case lowerCaseComment.indexOf('payment_processing') > -1:
        statusCategory = {
          category: 'Processing Payment',
          icon: 'fy-time-circle'
        };
        break;
      case (lowerCaseComment.indexOf('paid') > -1):
        statusCategory = {
          category: 'Paid',
          icon: 'fy-fill-check'
        };
        break;
      case (lowerCaseComment.indexOf('expense issues') > -1):
        statusCategory = {
          category: 'Expense Issues',
          icon: 'fy-exclamation-circle'
        };
        break;
      default:
        statusCategory = {
          category: 'Others',
          icon: 'fy-info-circle-o'
        };
        break;
    }

    return statusCategory;
  }

  createStatusMap(statuses, type) {
    const modifiedStatuses = statuses.map((status) => {
      const statusCategoryAndIcon = this.getStatusCategory(status.st.comment, type);
      status.st = Object.assign({}, status.st, statusCategoryAndIcon);
      return status;
    });

    return modifiedStatuses;
  }

  post(objectType, objectId, status, notify) {
    return this.apiService.post('/' + objectType + '/' + objectId + '/statuses', {
      status,
      // By default don't notify via mail for the new status to the interested parties.
      notify: notify || false
    });
  }

  find(objectType, objectId) {
    return this.apiService.get('/' + objectType + '/' + objectId + '/estatuses').pipe(
      map((estatuses) => {
        return estatuses.map(function (estatus) {
          const res = this.dataTransformService.unflatten(estatus);
          this.dateService.fixDates(res.st);
          res.st.created_at = this.dateService.getLocalDate(res.st.created_at);
          // TODO: Convert to proper format
          // res.st.createdAtNew = $filter('date')(res.st.created_at, 'MMM d, y');
          return res;
        });
      })
    );
  }

  findLatestComment(id, type, orgUserId) {
    return this.find(type, id).pipe(
      map((estatuses) => {
        const nonSystemEStatuses = estatuses.filter(eStatus => eStatus.us.full_name);
        const userComments = nonSystemEStatuses.filter((estatus) => {
          return estatus.st.org_user_id === orgUserId;
        });
        const sortedStatus = this.sortStatusByDate(userComments);
        if (sortedStatus.length) {
          return sortedStatus[0].st.comment;
        }
      })
    );
  }

  sortStatusByDate(estatus) {
    estatus.sort((a, b) => {
      const dateA = a.st.created_at;
      const dateB = b.st.created_at;
      if (dateA.getTime() > dateB.getTime()) {
        return -1;
      } else {
        return 1;
      }
    });

    return estatus;
  }

  filterNonSystemEStatuses(eStatus) {
    return eStatus.us.full_name;
  }

  filterSystemStatuses(status) {
    return ['SYSTEM', 'POLICY'].indexOf(status.st.org_user_id) > -1;
  }

  filterSystemEStatuses(eStatus) {
    return eStatus.st.org_user_id !== 'SYSTEM';
  }
}
