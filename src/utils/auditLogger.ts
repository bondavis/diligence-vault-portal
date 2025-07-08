import { supabase } from '@/integrations/supabase/client';

export type AuditEventType = 
  | 'user_login' 
  | 'user_logout'
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'request_create'
  | 'request_update'
  | 'request_delete'
  | 'response_submit'
  | 'questionnaire_start'
  | 'questionnaire_complete'
  | 'role_change'
  | 'deal_access'
  | 'deal_create'
  | 'user_assignment'
  | 'user_create_and_assign'
  | 'unauthorized_access_attempt'
  | 'data_export'
  | 'security_violation';

interface AuditLogDetails {
  action?: string;
  resource_id?: string;
  resource_type?: string;
  ip_address?: string;
  user_agent?: string;
  deal_id?: string;
  file_name?: string;
  previous_value?: any;
  new_value?: any;
  error_message?: string;
  [key: string]: any;
}

class AuditLogger {
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  private getClientInfo() {
    return {
      ip_address: 'client-side', // Note: Real IP would need server-side logging
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
  }

  async logEvent(eventType: AuditEventType, details: AuditLogDetails = {}) {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.warn('Attempted to log audit event without authenticated user');
        return;
      }

      const clientInfo = this.getClientInfo();
      const auditDetails = {
        ...details,
        ...clientInfo,
        event_type: eventType
      };

      // Use the existing log_security_event function
      const { error } = await supabase.rpc('log_security_event', {
        event_type: eventType,
        user_id: user.id,
        details: auditDetails
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Convenience methods for common audit events
  async logLogin(method: string = 'password') {
    await this.logEvent('user_login', { action: `login_${method}` });
  }

  async logLogout() {
    await this.logEvent('user_logout', { action: 'logout' });
  }

  async logFileUpload(fileName: string, fileSize: number, requestId: string) {
    await this.logEvent('file_upload', {
      action: 'file_upload',
      file_name: fileName,
      file_size: fileSize,
      resource_id: requestId,
      resource_type: 'diligence_request'
    });
  }

  async logFileDownload(fileName: string, documentId: string) {
    await this.logEvent('file_download', {
      action: 'file_download',
      file_name: fileName,
      resource_id: documentId,
      resource_type: 'document'
    });
  }

  async logFileDelete(fileName: string, documentId: string) {
    await this.logEvent('file_delete', {
      action: 'file_delete',
      file_name: fileName,
      resource_id: documentId,
      resource_type: 'document'
    });
  }

  async logRequestCreate(requestId: string, dealId: string, title: string) {
    await this.logEvent('request_create', {
      action: 'create_request',
      resource_id: requestId,
      resource_type: 'diligence_request',
      deal_id: dealId,
      title: title
    });
  }

  async logRequestUpdate(requestId: string, changes: any) {
    await this.logEvent('request_update', {
      action: 'update_request',
      resource_id: requestId,
      resource_type: 'diligence_request',
      new_value: changes
    });
  }

  async logRequestDelete(requestId: string, title: string) {
    await this.logEvent('request_delete', {
      action: 'delete_request',
      resource_id: requestId,
      resource_type: 'diligence_request',
      title: title
    });
  }

  async logResponseSubmit(responseId: string, requestId: string) {
    await this.logEvent('response_submit', {
      action: 'submit_response',
      resource_id: responseId,
      resource_type: 'diligence_response',
      request_id: requestId
    });
  }

  async logQuestionnaireStart(dealId: string) {
    await this.logEvent('questionnaire_start', {
      action: 'start_questionnaire',
      deal_id: dealId,
      resource_type: 'questionnaire_session'
    });
  }

  async logQuestionnaireComplete(dealId: string, sessionId: string) {
    await this.logEvent('questionnaire_complete', {
      action: 'complete_questionnaire',
      deal_id: dealId,
      resource_id: sessionId,
      resource_type: 'questionnaire_session'
    });
  }

  async logDealAccess(dealId: string, dealName: string) {
    await this.logEvent('deal_access', {
      action: 'access_deal',
      deal_id: dealId,
      deal_name: dealName,
      resource_type: 'deal'
    });
  }

  async logUnauthorizedAccess(attemptedAction: string, resourceType: string, resourceId?: string) {
    await this.logEvent('unauthorized_access_attempt', {
      action: attemptedAction,
      resource_type: resourceType,
      resource_id: resourceId,
      severity: 'high'
    });
  }

  async logSecurityViolation(violationType: string, details: any) {
    await this.logEvent('security_violation', {
      action: violationType,
      severity: 'critical',
      ...details
    });
  }

  async logDataExport(exportType: string, recordCount: number, dealId?: string) {
    await this.logEvent('data_export', {
      action: 'export_data',
      export_type: exportType,
      record_count: recordCount,
      deal_id: dealId,
      resource_type: 'data_export'
    });
  }
}

export const auditLogger = new AuditLogger();