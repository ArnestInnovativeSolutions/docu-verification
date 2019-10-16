import * as notify from '../core/notify';

notify.sendSMSAsync('+919686622751', 'test ', 'SMS Testing', false).then(message => {
    console.log(message);
});
