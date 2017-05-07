// HakaTimeline ////////////////////////////////////////////////////////////////////////////

class HakaTimeline {
  constructor(project, path) {
    this.project = project;
    this.path = path;
  }
  load() {
    return fetchJson(this.path).then(json => {
      this.timelineJson = json;
    });
  }
  render(container) {
    const mediaElement = createMediaElement(this.project.projectDir, this.timelineJson.media);
    container.appendChild(mediaElement);
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
