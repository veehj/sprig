import { render } from "./libs/uhtml.js";
import { view } from "./view.js";
import { upload } from "./upload.js";
import { run } from "./dispatches/run.js";
import { init } from "./dispatches/init.js";
import { logError } from "./dispatches/logError.js";
import { setName } from "./dispatches/setName.js";
import { saveToFile } from "./dispatches/export/saveToFile.js";
import "./dispatches/fetchAndBundle/fetchAndBundle.js";

const makeSampleLink = str => 
  `http://${window.location.host}/?file=http://${window.location.host}/games/${str}.js`

const STATE = {
  codemirror: undefined,
  errorInfo: null,
  logs: [],
  name: "game-name-here",
  notifications: [],
  editor: null,
  samples: [
    { 
      name: "maze",
      link: makeSampleLink("maze-v1")
    }
  ],
  sprites: {},
}

window.getState = () => console.log(STATE);

const ACTIONS = {
  INIT: init,
  RUN: run,
  SET_SPRITES({ sprites }, state) {
    state.sprites = sprites;
  }, 
  UPLOAD(args, state) {
    upload(state.codemirror.state.doc.toString());
  },
  SAVE_TO_FILE(args, state) {
    const prog = state.codemirror.state.doc.toString();
    saveToFile(`${state.name}.js`, prog);
  },
  LOG_ERROR: logError,
  SET_EDITOR(editor, state) {
    state.editor = editor;
    dispatch("RENDER");
    if (editor?.text) {
      const el = document.getElementById("asset-editor");
      el.loadInitValue && el.loadInitValue({
        text: editor.text,
        sprites: state.sprites
      });
    }
  },
  SET_EDITOR_TEXT({ text }, state) {
    const currentProgLength = state.codemirror.state.doc.toString();
    console.log(text);
    const changes = {
      from: 0,
      to: currentProgLength.length,
      insert: text
    };

    state.codemirror.dispatch({ changes })
  },
  SET_NAME: setName,
  LOAD_FROM_DATA({ data }, state) {
    console.log(data);
  },
  EDITOR_TEXT(text, state) {
    if (!state.editor) return console.log("EDITOR_TEXT but no editor");
    if (state.editor.debug) return console.log(text);
    
    state.codemirror.dispatch({ changes: {
      from: state.editor.from,
      to: state.editor.to,
      insert: text
    } })
    state.editor.to = state.editor.from + text.length;

    dispatch("RUN");
  },
  RENDER(args, state) {
    render(document.querySelector(".root"), view(state));
  },
}

export function dispatch(action, args = {}) {
  const trigger = ACTIONS[action];
  if (trigger) return trigger(args, STATE);
  else {
    console.log("Action not recongnized:", action);
    return null;
  }
}
