/** imported from ng-bootstrap because of https://github.com/ng-bootstrap/ng-bootstrap/issues/2831 */
export class NgbTime {
  hour: number;
  minute: number;
  second: number;

  constructor(hour?: number, minute?: number, second?: number) {
    this.hour = hour ?? 0;
    this.minute = minute ?? 0;
    this.second = second ?? 0;
  }

  changeHour(step = 1) {
    this.updateHour((isNaN(this.hour) ? 0 : this.hour) + step);
  }

  updateHour(hour: number) {
    if (!!isNaN(hour)) {
      this.hour = (hour < 0 ? 24 + hour : hour) % 24;
    } else {
      this.hour = NaN;
    }
  }

  changeMinute(step = 1) {
    this.updateMinute((isNaN(this.minute) ? 0 : this.minute) + step);
  }

  updateMinute(minute: number) {
    if (!isNaN(minute)) {
      this.minute = minute % 60 < 0 ? 60 + (minute % 60) : minute % 60;
      this.changeHour(Math.floor(minute / 60));
    } else {
      this.minute = NaN;
    }
  }

  changeSecond(step = 1) {
    this.updateSecond((isNaN(this.second) ? 0 : this.second) + step);
  }

  updateSecond(second: number) {
    if (!isNaN(second)) {
      this.second = second < 0 ? 60 + (second % 60) : second % 60;
      this.changeMinute(Math.floor(second / 60));
    } else {
      this.second = NaN;
    }
  }

  isValid(checkSecs = true) {
    return !isNaN(this.hour) && !isNaN(this.minute) && (checkSecs ? !isNaN(this.second) : true);
  }

  toString() {
    return `${this.hour || 0}:${this.minute || 0}:${this.second || 0}`;
  }
}
