/**
 * PDF Offline Processing Test
 */
import { classifyPDFContent } from '../src/lib/ai.js';

async function testPDFOffline() {
  console.log('📄 Testing PDF Offline Classification...');
  
  const chunk = "The atomic number of Carbon is 6. It has 4 valence electrons and forms covalent bonds.";
  const subject = "Chemistry";

  try {
    const result = await classifyPDFContent(chunk, subject);
    console.log('✅ Classification Result:', JSON.stringify(result, null, 2));
    
    if (result._fallback || result.offline) {
      console.log('\n✅ Verified: Fallback logic is working.');
    }
  } catch (error) {
    console.error('❌ PDF Test Failed:', error);
  }
}

testPDFOffline();
