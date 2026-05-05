const langs = {
  javascript: { compiler: 'nodejs-20.17.0', code: 'console.log("Hello JS");' },
  python: { compiler: 'cpython-3.14.0', code: 'print("Hello Py")' },
  java: { compiler: 'openjdk-jdk-22+36', code: 'class Main { public static void main(String[] args) { System.out.println("Hello Java"); } }' }
};

async function testAll() {
  for (const [name, data] of Object.entries(langs)) {
    console.log(`Testing ${name}...`);
    try {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compiler: data.compiler, code: data.code })
      });
      const result = await res.json();
      console.log(`${name} result:`, result.program_error || result.compiler_error || result.program_output);
    } catch (e) {
      console.error(`${name} failed:`, e.message);
    }
  }
}
testAll();
