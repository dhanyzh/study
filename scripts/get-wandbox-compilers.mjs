async function getCompilers() {
  const res = await fetch('https://wandbox.org/api/list.json');
  const list = await res.json();
  const langs = ['javascript', 'python', 'java'];
  for (const lang of langs) {
    const comps = list.filter(c => c.language.toLowerCase() === lang.toLowerCase());
    console.log(`--- ${lang} ---`);
    console.log(comps.map(c => c.name).join(', '));
  }
}
getCompilers();
