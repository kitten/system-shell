import { App, Astal, Gdk, Gtk } from "astal/gtk4"
import { bind, interval, timeout, Variable, AstalIO } from "astal"

const { WindowAnchor, Exclusivity } = Astal;

import AstalHyprland from "gi://AstalHyprland";
import AstalNetwork from "gi://AstalNetwork";
import AstalBattery from "gi://AstalBattery";
import AstalSound from "gi://AstalWp";

function WorkspaceMenuItem({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const hyprland = AstalHyprland.get_default();
  const geometry = gdkmonitor.get_geometry();
  const xy = `${geometry.x}:${geometry.y}`;

  const workspaces = bind(hyprland, 'workspaces').as((workspaces) => {
    return workspaces.filter((workspace) => {
      const monitor = workspace.get_monitor();
      const workspace_xy = `${monitor.x}:${monitor.y}`;
      return workspace_xy === xy;
    });
  });

  const children = Variable.derive(
    [bind(hyprland, 'focusedWorkspace'), workspaces],
    (focusedWorkspace, workspaces) => {
      if (workspaces.length <= 1)
        return <box visible={false} />;
      return workspaces
        .sort((a, b) => a.id - b.id)
        .map((workspace) => {
          const isActive = focusedWorkspace.id === workspace.id;
          return (
            <button
              cssClasses={isActive ? ["workspace", "active"] : ["workspace"]}
              valign={Gtk.Align.CENTER}
              heightRequest={9}
              widthRequest={9}
              onClicked={() => {
                workspace.focus();
              }}
            />
          );
        });
    },
  );
  return (
    <box cssClasses={["menuitem"]}>
      {children()}
    </box>
  );
}

function NetworkMenuItem() {
  const network = AstalNetwork.get_default();
  const networkPrimary = bind(network, 'primary');
  const networkIcon = Variable('network-idle-symbolic');

  const onNetworkIconUpdate = (icon: string) => {
    networkIcon.set(icon);
  };

  const onPrimaryUpdate = (primary: AstalNetwork.Primary) => {
    if (disposeNetworkIcon) disposeNetworkIcon();
    switch (primary) {
      case AstalNetwork.Primary.WIFI:
        onNetworkIconUpdate(network.wifi.icon_name);
        return disposeNetworkIcon = bind(network.wifi, 'icon_name').subscribe(onNetworkIconUpdate);
      case AstalNetwork.Primary.WIRED:
        onNetworkIconUpdate(network.wired.icon_name);
        return disposeNetworkIcon = bind(network.wired, 'icon_name').subscribe(onNetworkIconUpdate);
      default:
        onNetworkIconUpdate('network-idle-symbolic');
    }
  };

  let disposeNetworkIcon: (() => void) | undefined;
  const disposeNetworkPrimary = networkPrimary.subscribe(onPrimaryUpdate);
  onPrimaryUpdate(network.primary);

  const onDestroy = () => {
    disposeNetworkPrimary();
    if (disposeNetworkIcon) disposeNetworkIcon();
  };

  return (
    <box
      cssClasses={["menuitem"]}
      onDestroy={onDestroy}
    >
      <image
        iconName={networkIcon()}
        valign={Gtk.Align.CENTER}
      />
    </box>
  );
}

function VolumeMenuItem() {
  const speaker = AstalSound.get_default()?.get_default_speaker();
  if (!speaker) {
    return <box visible={false} />;
  }
  const speakerIcon = Variable.derive(
    [bind(speaker, 'volume_icon'), bind(speaker, 'mute')],
    (volumeIcon, isMuted) => isMuted ? 'audio-volume-muted' : volumeIcon
  );
  return (
    <box cssClasses={["menuitem"]}>
      <image
        iconName={speakerIcon()}
        valign={Gtk.Align.CENTER}
      />
    </box>
  );
}

function BatteryMenuItem() {
  const battery = AstalBattery.get_default();
  return (
    <box cssClasses={["menuitem"]} visible={bind(battery, 'is_present')}>
      <label label={bind(battery, 'percentage').as(v => `${Math.floor(v * 100)}%`)} />
      <image
        iconName={bind(battery, 'icon_name')}
        valign={Gtk.Align.CENTER}
      />
    </box>
  );
}

function TimeMenuItem() {
  const INTERVAL = 60_000;
  const TOLERANCE = 5_000;
  const time = Variable(new Date());

  const getTimeLabel = (date: Date) => {
    const hh = '' + date.getHours();
    const mm = '' + date.getMinutes();
    return `${hh}:${mm.padStart(2, '0')}`;
  };

  const scheduleTimeUpdate = () => {
    if (timer) timer.cancel();
    timer = timeout(INTERVAL - (time.get().valueOf() % INTERVAL), () => {
      time.set(new Date());
      timer = interval(INTERVAL, () => {
        time.set(new Date());
        if (time.get().valueOf() % INTERVAL >= TOLERANCE) {
          scheduleTimeUpdate();
        }
      });
    });
  };

  let timer: AstalIO.Time;
  scheduleTimeUpdate();

  const onDestroy = () => {
    timer.cancel();
  };

  return (
    <box cssClasses={["menuitem"]} onDestroy={onDestroy}>
      <label label={time(getTimeLabel)} />
    </box>
  );
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  return (
    <window
      layer={Astal.Layer.TOP}
      visible
      cssClasses={["Bar"]}
      namespace="system-bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Exclusivity.EXCLUSIVE}
      anchor={WindowAnchor.TOP | WindowAnchor.LEFT | WindowAnchor.RIGHT}
      application={App}
    >
      <centerbox cssName="centerbox" heightRequest={40}>
        <box spacing={19}>
          <WorkspaceMenuItem gdkmonitor={gdkmonitor} />
        </box>
        <box />
        <box spacing={19}>
          <NetworkMenuItem />
          <VolumeMenuItem />
          <BatteryMenuItem />
          <TimeMenuItem />
        </box>
      </centerbox>
    </window>
  );
}
