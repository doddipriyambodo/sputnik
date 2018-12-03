import { Injectable } from '@angular/core';
import { LocalStorage } from '@ngx-pwa/local-storage';

// import * as jwtDecode from 'jwt-decode';

// AWS
import { AmplifyService } from 'aws-amplify-angular';
// import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';

// Models
import { ProfileInfo } from '../models/profile-info.model';

// Services
import { LoggerService } from './logger.service';

export interface CognitoCallback {
    cognitoCallback(message: string, result: any): void;
}

export interface LoggedInCallback {
    isLoggedIn(message: string, loggedIn: boolean, profile: ProfileInfo): void;
}

@Injectable()
export class UserLoginService {
    constructor(
        public amplifyService: AmplifyService,
        protected localStorage: LocalStorage,
        private logger: LoggerService
    ) {
        this.amplifyService = amplifyService;
    }

    authenticate(username: string, password: string, callback: CognitoCallback) {
        const _self = this;
        _self.logger.info('UserLoginService.authenticate: starting the authentication');
        _self.amplifyService
            .auth()
            .signIn(username, password)
            .then(user => {
                _self.logger.info('UserLoginService.authenticate: successfully logged in', user);

                if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                    _self.logger.warn('UserLoginService.authenticate: User needs to set password.');
                    callback.cognitoCallback('User needs to set password.', null);
                } else {
                    _self
                        .getUserInfo()
                        .then((data: ProfileInfo) => {
                            _self.localStorage.setItem('profile', data).subscribe(() => {});
                            callback.cognitoCallback(null, user);
                        })
                        .catch(err2 => {
                            _self.logger.error('[Error] Error occurred retrieving user info to validate admin role.');
                            _self.logger.error(err2);
                            callback.cognitoCallback(null, user);
                        });
                }
            })
            .catch(err => {
                _self.logger.error(err);
                callback.cognitoCallback(err.message, null);
            });
    }

    forgotPassword(username: string, callback: CognitoCallback) {
        const _self = this;
        _self.logger.info('UserLoginService.forgotPassword(', username, ')');
        _self.amplifyService
            .auth()
            .forgotPassword(username)
            .then(data => {
                _self.logger.info('UserLoginService.forgotPassword(', username, '):', data);
                callback.cognitoCallback(null, null);
            })
            .catch(err => {
                _self.logger.info('UserLoginService.forgotPassword(', username, '): Error:', err);
                callback.cognitoCallback(err.message, null);
            });
    }

    confirmNewPassword(email: string, verificationCode: string, password: string, callback: CognitoCallback) {
        const _self = this;
        _self.logger.info('UserLoginService.confirmNewPassword(', email, ',', verificationCode, ')');
        _self.amplifyService
            .auth()
            .forgotPasswordSubmit(email, verificationCode, password)
            .then(data => {
                _self.logger.info('UserLoginService.confirmNewPassword(', email, ',', verificationCode, '):', data);
                callback.cognitoCallback(null, null);
            })
            .catch(err => {
                _self.logger.error(
                    'UserLoginService.confirmNewPassword(',
                    email,
                    ',',
                    verificationCode,
                    '): Errro:',
                    err
                );
                callback.cognitoCallback(err.message, null);
            });
    }

    changePassword(oldpassword: string, newpassword: string) {
        const _self = this;
        return _self.amplifyService
            .auth()
            .currentAuthenticatedUser()
            .then(user => {
                return _self.amplifyService
                    .auth()
                    .userSession(user)
                    .then(session => {
                        _self.logger.info('UserLoginService.changePassword: Session is ' + session.isValid());
                        if (session.isValid()) {
                            return _self.amplifyService.auth().changePassword(user, oldpassword, newpassword);
                        } else {
                            throw new Error('The users current session is invalid.');
                        }
                    });
            })
            .catch(err => {
                _self.logger.warn('UserLoginService.changePassword: cant retrieve the current user');
                throw new Error('Cant retrieve the CurrentUser');
            });
    }

    logout() {
        this.logger.info('UserLoginService: Logging out');
        this.amplifyService.auth().signOut();
    }

    isAuthenticated(callback: LoggedInCallback, loadProfile: boolean) {
        const _self = this;
        if (callback == null) {
            throw new Error('UserLoginService.isAuthenticated: Callback in isAdminAuthenticated() cannot be null');
        }

        _self.amplifyService
            .auth()
            .currentAuthenticatedUser()
            .then(user => {
                return _self.amplifyService.auth().userSession(user);
            })
            .then(session => {
                _self.logger.info(
                    'UserLoginService.isAuthenticated(' + loadProfile + '): Session is ' + session.isValid()
                );
                if (session.isValid()) {
                    if (loadProfile) {
                        return _self
                            .getUserInfo()
                            .then((data: ProfileInfo) => {
                                _self.logger.info(
                                    'UserLoginService.isAuthenticated(' + loadProfile + '): getUserInfo:',
                                    data
                                );
                                return callback.isLoggedIn(null, session.isValid(), data);
                            })
                            .catch(err => {
                                _self.logger.error(
                                    '[Error] Error occurred retrieving user info to validate admin role.'
                                );
                                _self.logger.error(err);
                            });
                    }
                }
                return callback.isLoggedIn(null, session.isValid(), null);
            })
            .catch(err => {
                _self.logger.warn(
                    'UserLoginService.isAuthenticated(' +
                        loadProfile +
                        '): cant retrieve the current authenticated user',
                    err
                );
                callback.isLoggedIn(err.message, false, null);
            });
    }

    getUserInfo() {
        const _self = this;

        _self.logger.info('UserLoginService.getUserInfo');

        return _self.amplifyService
            .auth()
            .currentSession()
            .then(session => {
                _self.logger.info('UserLoginService.getUserInfo: session', session);
                const payload = session.getIdToken().decodePayload();
                const data = {
                    user_id: payload['cognito:username'],
                    email: payload.email,
                    name: payload.nickname,
                    enabled: payload.email_verified,
                    groups: payload['cognito:groups']
                };
                // const _decodedJwt = jwtDecode(session.getIdToken().getJwtToken());
                // const data = {
                //   user_id: _decodedJwt['cognito:username'],
                //   email: _decodedJwt.email,
                //   name: _decodedJwt.nickname,
                //   enabled: _decodedJwt.email_verified,
                //   groups: _decodedJwt['cognito:groups']
                // };
                _self.logger.info('UserLoginService.getUserInfo:', data);
                return new ProfileInfo(data);
            })
            .catch(err => {
                _self.logger.error('UserLoginService.getUserInfo: ERROR', err);
                throw new Error(err.message);
            });
    }
}
