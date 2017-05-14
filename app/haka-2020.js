// HakaTimeline ////////////////////////////////////////////////////////////////////////////

class HakaTimeline {
  constructor(project, path) {
    this.project = project;
    this.path = path;
  }
  load() {
    return fetchJson(this.path).then(json => {
      this.data = json;
    });
  }
  render(container) {
    this.container = container;
    this.container.addEventListener('click', this._handleClick.bind(this));
    this.mediaElement = createMediaElement(this.project.projectDir, this.data.media);
    this.container.appendChild(this.mediaElement);
    this._runAction(this.data.startAction);
  }
  _runAction(action) {
    switch (action.type) {
      case 'dialog':
        this._showDialog(action.data);
        break;
      case 'resume':
        this._executeResumeAction(action.data);
        break;
      default:
        throw new Error(`Invalid action type '${action.type}'.`);
    }
  }
  _showDialog(data) {
    console.log(data);
    const buttons = data.buttons.map(button => `
      <button data-action="${htmlEncode(button.action)}">
        ${htmlEncode(button.text)}
      </button>
    `);
    const html = `
      <div>
        <h3>${htmlEncode(data.title)}</h3>
        <p>${htmlEncode(data.text)}</p>
        <p>${buttons.join('')}</p>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', html);
  }
  _handleClick(event) {
    const actionJson = event.target.getAttribute('data-action');
    if (actionJson) {
      const action = JSON.parse(actionJson);
      this._runAction(action);
    }
  }
  _executeResumeAction(data) {
    const marker = this.data.markers.find(m => m.name === data.markerName);
    if (!marker) throw new Error(`Marker '${data.markerName} not found.`);
    this.mediaElement.currentTime = convertTimeCodeToSeconds(marker.timeCode);
    this.mediaElement.play();
  }
}

function createMediaElement(projectDir, media) {
  let mediaElement;
  switch (media.type) {
    case 'video':
      mediaElement = document.createElement('video');
      break;
    default:
      throw new Error(`Invalid media type '${media.type}'.`);
  }
  mediaElement.src = combinePaths(projectDir, media.path);
  mediaElement.controls = true;
  return mediaElement;
}

function htmlEncode(obj) {
  let text;
  if (obj === null || obj === undefined) {
    text = '';
  } else {
    text = (typeof obj === 'object') ? JSON.stringify(obj) : `${obj}`;
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/`/g, '&#96;');
}

function convertTimeCodeToSeconds(timeCode) {
  const parts = /^(\d+)\:(\d+)\:(\d+)\.(\d+)$/.exec(timeCode);
  const hours = Number.parseInt(parts[1]);
  const minutes = Number.parseInt(parts[2]);
  const seconds = Number.parseInt(parts[3]);
  const milliseconds = Number.parseInt(parts[4]);
  return (hours * 60 * 60) + (minutes * 60) + seconds + (milliseconds / 1000);
}

// HakaProject ////////////////////////////////////////////////////////////////////////////

class HakaProject {
  constructor(projectDir) {
    this.projectDir = projectDir;
  }
  load() {
    return fetchJson(`${this.projectDir}/project.json`)
      .then(json => this.main = createMain(this, json.main))
      .then(() => this.main.load());
  }
  render(container) {
    return this.main.render(container);
  }
}

function createMain(project, main) {
  switch (main.type) {
    case 'timeline':
      const timelinePath = combinePaths(project.projectDir, main.path);
      return new HakaTimeline(project, timelinePath);
    default:
      throw new Error(`Invalid main type '${main.type}'.`);
  }
}

// Helpers ////////////////////////////////////////////////////////////////////////////

function combinePaths(basePath, path) {
  path = path.replace(/^\.\//, '');
  return `${basePath}/${path}`;
}

function fetchJson(path) {
  return fetch(path).then(res => res.json());
}

// Global ////////////////////////////////////////////////////////////////////////////

window.HakaProject = HakaProject;
