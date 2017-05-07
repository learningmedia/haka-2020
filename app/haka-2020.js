class HakaProject {
  render(element) {
    element.textContent = 'Hello World';
  }
}

const haka2020 = window.haka2020 = {
  loadProject: projectDir => {
    const project = new HakaProject();
    return Promise.resolve(project);
  }
};
