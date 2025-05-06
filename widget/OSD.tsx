import { AstalIO } from "astal"
import { App, Astal, Gdk, Gtk } from "astal/gtk4"
import { timeout } from "astal/time"
import Variable from "astal/variable"
import Brightness from "../utils/brightness"
import AstalSound from "gi://AstalWp"

function OnScreenProgress({ visible }: { visible: Variable<boolean> }) {
  const brightness = Brightness.get_default();
  const speaker = AstalSound.get_default()?.get_default_speaker();

  const icon = Variable('');
  const value = Variable(0);

  let timer: AstalIO.Time | undefined;
  function reveal() {
    visible.set(true);
    if (timer) timer.cancel();
    timer = timeout(1500, () => {
      timer = undefined;
      visible.set(false)
    });
  }

  let isMounted = false;
  timeout(1000, () => {
    isMounted = true;
  });

  let currentBrightness = brightness.screen || undefined;
  function osdBrightness() {
    if (!isMounted || currentBrightness === undefined) {
      currentBrightness = brightness.screen;
    } else if (currentBrightness !== brightness.screen) {
      value.set(currentBrightness = brightness.screen);
      icon.set(
        currentBrightness > 0 ? 'display-brightness-symbolic' : 'display-brightness-off-symbolic'
      );
      reveal();
    }
  }

  let currentVolume = speaker?.volume || undefined;
  let currentVolumeIcon = speaker?.volumeIcon || undefined;
  function osdVolume() {
    const volume = !speaker?.mute ? speaker?.volume || 0 : 0;
    if (!isMounted || speaker != null && (currentVolume === undefined || currentVolumeIcon === undefined)) {
      currentVolume = volume;
      currentVolumeIcon = speaker?.volumeIcon;
    } else if (speaker != null && (currentVolume !== volume || currentVolumeIcon !== speaker.volumeIcon)) {
      icon.set(currentVolumeIcon = speaker.volumeIcon);
      value.set(currentVolume = volume);
      reveal();
    }
  }

  const brightnessId = brightness.connect('notify::screen', osdBrightness);
  const volumeId = speaker?.connect('notify::volume', osdVolume);
  const muteId = speaker?.connect('notify::mute', osdVolume);

  return (
    <box
      cssClasses={["OSD"]}
      spacing={4}
      onDestroy={() => {
        brightness.disconnect(brightnessId);
        speaker?.disconnect(volumeId!);
        speaker?.disconnect(muteId!);
      }}
    >
      <label
        label={value(v => `${Math.floor(v * 100)}%`)}
        widthChars={4}
      />
      <image iconName={icon()} />
      <levelbar
        valign={Gtk.Align.CENTER}
        widthRequest={200}
        value={value(v => Math.min(1, v))}
        minValue={0}
        maxValue={1}
      />
    </box>
  );
}

export default function OSD(monitor: Gdk.Monitor) {
    const visible = Variable(false)

    return (
        <window
            visible={visible()}
            cssClasses={["OSD"]}
            namespace="system-shell"
            gdkmonitor={monitor}
            application={App}
            layer={Astal.Layer.OVERLAY}
            keymode={Astal.Keymode.NONE}
            anchor={Astal.WindowAnchor.BOTTOM}
        >
          <OnScreenProgress visible={visible} />
        </window>
    )
}
