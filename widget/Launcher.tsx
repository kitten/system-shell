import { App, Astal, Gdk, Gtk } from "astal/gtk4"
import { Variable } from "astal"
import AstalApps from "gi://AstalApps"

const MAX_ITEMS = 8

function AppButton({ app, onSelect }: {
  app: AstalApps.Application;
  onSelect(app: AstalApps.Application): void;
}) {
  const onClicked = () => onSelect(app);

  return (
    <button
      cssClasses={['AppButton']}
      onClicked={onClicked}
    >
      <box>
        <image iconName={app.iconName} />
        <box valign={Gtk.Align.CENTER} vertical>
          <label
            cssClasses={['name']}
            xalign={0}
            label={app.name}
            singleLineMode
          />
          {app.description && (
            <label
              cssClasses={['description']}
              wrap
              xalign={0}
              label={app.description}
            />
          )}
        </box>
      </box>
    </button>
  );
}

export default function Applauncher() {
  let window: Astal.Window | undefined;

  const { CENTER } = Gtk.Align;
  const apps = new AstalApps.Apps();
  const text = Variable('');
  const list = text(text => apps.fuzzy_query(text).slice(0, MAX_ITEMS))

  const onHide = () => {
    window?.close();
  };

  const onEnter = () => {
    apps.fuzzy_query(text.get())?.[0].launch();
    onHide();
  };

  const onSelect = (app: AstalApps.Application) => {
    app.launch();
    onHide();
  };

  return (
    <window
      visible
      cssClasses={['AppLauncher']}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.ON_DEMAND}
      application={App}
      setup={(self) => {
        window = self;
      }}
      onKeyPressed={(self, keyval) => {
        if (keyval === Gdk.KEY_Escape) {
          self.close();
        }
      }}
    >
      <box
        widthRequest={500}
        cssClasses={['Applauncher']}
        vertical
      >
        <entry
          placeholderText="Search"
          onChanged={self => text.set(self.text)}
          onActivate={onEnter}
        />
        <box spacing={6} vertical>
          {list.as(list => list.map(app => (
            <AppButton
              onSelect={onSelect}
              app={app}
            />
          )))}
        </box>
        <box
          halign={CENTER}
          cssClasses={["not-found"]}
          vertical
          visible={list.as(l => l.length === 0)}
        >
          <image iconName="system-search-symbolic" />
          <label label="No match found" />
        </box>
      </box>
    </window>
  );
}
