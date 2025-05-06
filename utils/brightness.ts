import GObject, { register, property } from "astal/gobject"
import { Gio, monitorFile, readFileAsync } from "astal/file"
import { exec, execAsync } from "astal/process"

@register({ GTypeName: 'Brightness' })
export default class Brightness extends GObject.Object {
  static instance: Brightness

  static get_default() {
    if (!this.instance) this.instance = new Brightness();
    return this.instance;
  }

  #currentValue: number;
  #maxValue: number;

  constructor() {
    super();
    const [panelName, _deviceClass, currentValue, _currentPercentage, maxValue] = exec('brightnessctl info -m').split(',');
    this.#maxValue = Number(maxValue) || 1;
    this.#currentValue = Number(currentValue) / this.#maxValue;
    monitorFile(`/sys/class/backlight/${panelName}/brightness`, async (file, event) => {
      if (event === Gio.FileMonitorEvent.CHANGED) {
        const brightness = await readFileAsync(file);
        this.#currentValue = Number(brightness) / this.#maxValue;
        this.notify('screen');
      }
    });
  }

  @property(Number)
  get screen() {
    return this.#currentValue;
  }

  set screen(percent) {
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;

    execAsync(`brightnessctl set ${Math.floor(percent * 100)}% -q`).then(() => {
      this.#maxValue = percent;
      this.notify('screen');
    })
  }
}
