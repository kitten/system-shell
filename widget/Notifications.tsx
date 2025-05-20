import { App, Astal, Gtk, Gdk } from "astal/gtk4"
import { GLib, Gio, Time, bind, timeout } from "astal"
import AstalNotifd from "gi://AstalNotifd";
import Pango from "gi://Pango?version=1.0";
import AstalApps from "gi://AstalApps";

const TIMEOUT_DELAY = 4200;

const fileExists = (path: string) =>
  GLib.file_test(path, GLib.FileTest.EXISTS)

const time = (time: number, format = "%H:%M") => GLib.DateTime
  .new_from_unix_local(time)
  .format(format)!;

const urgency = (notification: AstalNotifd.Notification) => {
    const { LOW, NORMAL, CRITICAL } = AstalNotifd.Urgency;
    switch (notification.urgency) {
      case LOW:
        return 'low';
      case CRITICAL:
        return 'critical';
      case NORMAL:
      default:
        return 'normal';
    }
}

const getIconFromDesktopEntry = (desktopEntry: string): string | undefined =>
  new AstalApps.Apps().exact_query(desktopEntry)[0]?.iconName;

function Notification({ notification }: { notification: AstalNotifd.Notification; }) {
  const { START, CENTER, END } = Gtk.Align;
  const actions = notification.get_actions();
  const appIcon = notification.appIcon || getIconFromDesktopEntry(notification.desktopEntry);
  const imageExists = !!notification.image && fileExists(notification.image);
  const imageFile = notification.image && imageExists ? notification.image : undefined;
  const imageIcon = notification.image && !imageExists ? notification.image : undefined;

  let timer: Time | undefined;
  const scheduleDismiss = () => {
    timer?.cancel();
    timer = timeout(TIMEOUT_DELAY, () => {
      timer = undefined;
      notification.dismiss();
    });
  };

  const cancelDismiss = () => {
    timer?.cancel();
    timer = undefined;
  };

  const dismiss = () => {
    cancelDismiss();
    notification.dismiss();
  };

  return (
    <button
      cssClasses={['Notification', urgency(notification)]}
      onHoverEnter={cancelDismiss}
      onHoverLeave={scheduleDismiss}
      onDestroy={cancelDismiss}
      onClicked={dismiss}
      widthRequest={400}
      setup={scheduleDismiss}
    >
      <image
        cssClasses={['app-icon']}
        visible={!!appIcon}
        iconName={appIcon}
        widthRequest={24}
        heightRequest={24}
      />
      <box cssClasses={['content']} vertical>
        <box cssClasses={['header']}>
          <label
            halign={START}
            cssClasses={['app-name']}
            label={notification.appName || 'Unknown'}
          />
          <label
            cssClasses={['time']}
            hexpand
            halign={END}
            label={time(notification.time)}
          />
        </box>
        <label
          cssClasses={notification.body ? ['summary', 'bold'] : ['summary']}
          halign={START}
          xalign={0}
          label={notification.summary}
          lines={1}
        />
        {notification.body && (
          <label
            cssClasses={['body']}
            wrap
            useMarkup
            halign={START}
            xalign={0}
            justify={Gtk.Justification.FILL}
            ellipsize={Pango.EllipsizeMode.END}
            label={notification.body}
            lines={2}
            maxWidthChars={1}
            hexpand
          />
        )}
        {notification.image && (
          <box cssClasses={['image-wrapper']}>
            <Gtk.Separator visible />
            <image
              valign={END}
              hexpand
              cssClasses={['image']}
              iconName={imageIcon}
              file={imageFile}
            />
          </box>
        )}
        {actions.length > 0 && (
          <box cssClasses={['actions']}>
            {actions.map(({ label, id }) => (
              <button
                hexpand
                onClicked={() => notification.invoke(id)}
              >
                <label label={label} halign={CENTER} hexpand />
              </button>
            ))}
          </box>
        )}
      </box>
    </button>
  );
}

export default function NotificationPopups(gdkmonitor: Gdk.Monitor) {
  const notifd = AstalNotifd.get_default();

  const children = new Map<number, Gtk.Widget>();
  const notifications = bind(notifd, 'notifications').as((notifications) => {
    const seen = new Set<number>();
    const elements = notifications.map((notification) => {
      let child = children.get(notification.id);
      if (!child) {
        children.set(notification.id, child = <Notification notification={notification} />);
      }
      seen.add(notification.id);
      return child;
    });
    children.forEach((_child, id) => {
      if (!seen.has(id)) children.delete(id);
    });
    return elements;
  });

  return (
    <window
      layer={Astal.Layer.TOP}
      visible={notifications.as((list) => list.length > 0)}
      cssClasses={['NotificationPopups']}
      namespace="system-shell"
      gdkmonitor={gdkmonitor}
      application={App}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
    >
      <box vertical>
        {notifications}
      </box>
    </window>
  );
}
