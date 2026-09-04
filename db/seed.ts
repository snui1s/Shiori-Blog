import { db, Post, User } from 'astro:db';

export default async function seed() {
  const categories = ['Life', 'Review', 'Travel', 'Food', 'Thought'];
  const titles = [
    'คาเฟ่เปิดใหม่ที่อารีย์ บรรยากาศดีม้าก',
    'รีวิวกล้องฟิล์มตัวแรกในชีวิต',
    'ทำไมการตื่นเช้าถึงเปลี่ยนชีวิตฉัน',
    'ทริปเชียงใหม่คนเดียวฉบับงบประหยัด',
    'เมนูสุขภาพทำง่ายๆ ใน 10 นาที',
    'หนังสือที่อ่านแล้วอยากบอกต่อ',
    'มุมโปรดในห้องที่ทำให้มีความสุข',
    'เดินเล่นย่านพระนครยามเย็น',
    'วิธีจัดการความเครียดในฉบับของ Shiori',
    'ลองทำสปาเก็ตตี้คาโบนาร่าครั้งแรก',
    'แนะนำ Playlist ฟังตอนฝนตก',
    'สรุปสิ่งที่ได้เรียนรู้ในปีที่ผ่านมา',
    'พาไปดูนิทรรศการศิลปะใจกลางเมือง',
    'ต้นไม้ในบ้านที่ปลูกแล้วรอด!',
    'สกินแคร์รูทีนหน้าใสฉบับคนนอนน้อย',
    'ความสุขง่ายๆ ของการอยู่บ้าน',
    'ไปนวดหน้าผ่อนคลายที่สปาสุดหรู',
    'หัดวาดรูปสีน้ำวันหยุด',
    'จัดโต๊ะคอมใหม่ให้น่าทำงาน',
    'ก้าวต่อไปของ Shiori'
  ];

  const images = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    'https://images.unsplash.com/photo-1452784444945-3f422708fe5e',
    'https://images.unsplash.com/photo-1506477331477-33d6d8b3dc85',
    'https://images.unsplash.com/photo-1518131683597-90a6042db682',
    'https://images.unsplash.com/photo-1528698853043-5df3b44ec6fa',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570',
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85',
    'https://images.unsplash.com/photo-1513519245088-0e12902e17ea',
    'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f',
    'https://images.unsplash.com/photo-1473093226795-af9932fe5856',
    'https://images.unsplash.com/photo-1514845505178-849c2358937a',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
    'https://images.unsplash.com/photo-1501066927592-3ef7cc67e810',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858',
    'https://images.unsplash.com/photo-1519735815421-396564619965',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a'
  ];

  const posts = titles.map((title, i) => {
    // สร้าง content ที่มี bullet และ number list สำหรับ test
    const richContent = `
      <p>เนื้อความบันทึกที่ ${i + 1} อันแสนนุ่มนวลและเป็นกันเอง...</p>
      <p>เรื่องราวของ ${title} มันเริ่มจากที่ฉัน...</p>
      
      <h2>สิ่งที่ชอบในเรื่องนี้:</h2>
      <ul>
        <li>บรรยากาศดีมาก เหมาะกับการนั่งเล่น</li>
        <li>ราคาไม่แพง คุ้มค่าเงินที่จ่าย</li>
        <li>พนักงานน่ารัก บริการดี</li>
        <li>มีมุมถ่ายรูปเยอะ</li>
      </ul>
      
      <h2>ขั้นตอนการเตรียมตัว:</h2>
      <ol>
        <li>เตรียมกล้องและอุปกรณ์ให้พร้อม</li>
        <li>วางแผนเส้นทางล่วงหน้า</li>
        <li>จองที่พักถ้าไปต่างจังหวัด</li>
        <li>เช็คสภาพอากาศก่อนออกเดินทาง</li>
        <li>เตรียมใจพร้อมรับประสบการณ์ใหม่ๆ</li>
      </ol>
      
      <blockquote>ความสุขง่ายๆ มักซ่อนอยู่ในสิ่งเล็กๆ รอบตัว</blockquote>
      
      <img src="${images[i]}" alt="${title}" />
      
      <p>หวังว่าจะได้กลับมาเล่าเรื่องราวอีกนะจ๊ะ 🏮</p>
    `;
    
    return {
      title: title,
      slug: `post-${i + 1}`,
      excerpt: `นี่คือคำโปรยบันทึกที่ ${i + 1} ของ Shiori เกี่ยวกับเรื่อง ${title} ลองมาอ่านกันดูนะจ๊ะ...`,
      content: richContent,
      category: categories[i % categories.length],
      imageUrl: images[i],
      author: 'Shiori',
      createdAt: new Date(Date.now() - i * 3600000 * 24) // ลดหลั่นวันกันไปเพื่อทดสอบ Pagination
    };
  });

  const showcasePost = {
    title: "รวมมิตรจัดเต็ม! ทดสอบสไตล์ข้อความ H1->H4 และสารบัญลอย (Typography & TOC Showcase)",
    slug: "typography-showcase",
    excerpt: "โพสต์พิเศษสำหรับทดสอบการจัดรูปแบบข้อความทุกรูปแบบ: H1->H4, ตัวหนา, ตัวเอียง, ขีดฆ่า, ไฮไลต์สี, สีตัวอักษร, โค้ดบล็อก, ตาราง, คำคม และทดสอบการทำงานของสารบัญลอยด้านซ้าย!",
    category: "Review",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
    author: "Shiori Admin",
    createdAt: new Date(),
    content: `
      <p>ยินดีต้อนรับสู่โพสต์สำหรับทดสอบการแสดงผลและระบบจัดรูปแบบข้อความของ <strong>Shiori Blog</strong> โพสต์นี้สร้างขึ้นมาเพื่อให้คุณได้ตรวจเช็คด้วยตาตัวเองในทุกองค์ประกอบ ตั้งแต่ระดับหัวข้อ <code>H1 -> H4</code>, สไตล์ตัวอักษร, รายการ, โค้ดบล็อก, ตาราง, ไปจนถึง <strong>สารบัญลอยด้านซ้าย (Floating TOC)</strong> และ <strong>หลอดความคืบหน้าสีเขียว (Green Reading Bar)</strong></p>
      <hr />
      <h2>1. การจัดรูปแบบตัวอักษรและสีสัน (Typography & Text Styles)</h2>
      <p>ทดสอบสไตล์การเน้นข้อความแบบต่างๆ:</p>
      <ul>
        <li><strong>ตัวหนา (Bold Text)</strong>: เน้นคำสำคัญ</li>
        <li><em>ตัวเอียง (Italic Text)</em>: สำหรับคำทับศัพท์</li>
        <li><u>ขีดเส้นใต้ (Underline Text)</u>: สำหรับเน้นคำเตือน</li>
        <li><s>ข้อความขีดฆ่า (Strikethrough)</s> และ <del>ข้อความที่ถูกลบ (Del Tag)</del></li>
        <li><code>inline code block</code>: คำสั่งโปรแกรม</li>
        <li><a href="https://shiori-blog.space" target="_blank" rel="noopener noreferrer">ลิงก์ภายนอกแบบปลอดภัย</a></li>
      </ul>
      <p>
        <mark style="background-color: #fef08a" data-color="#fef08a">ไฮไลต์สีเหลือง</mark> |
        <mark style="background-color: #bbf7d0" data-color="#bbf7d0">ไฮไลต์สีเขียวพาสเทล</mark> |
        <mark style="background-color: #fecdd3" data-color="#fecdd3">ไฮไลต์สีชมพูซากุระ</mark>
      </p>
      <p>
        <span style="color: #ef4444">ตัวอักษรสีแดง</span>, 
        <span style="color: #3b82f6">ตัวอักษรสีน้ำเงิน</span>, 
        <span style="color: #10b981">ตัวอักษรสีเขียวมรกต</span>, 
        <span style="color: #8b5cf6">ตัวอักษรสีม่วงลาเวนเดอร์</span>
      </p>
      <h2>2. ลำดับหัวข้อหลายระดับ (Heading Hierarchy H1->H4)</h2>
      <p>ทดสอบการส่องหัวข้อของสารบัญด้านซ้าย:</p>
      <h3>2.1 หัวข้อย่อยระดับ 3 ข้อแรก (Sub-section H3 Alpha)</h3>
      <p>สารบัญจะเยื้องเข้ามา 1 ระดับพร้อมจุดบอกตำแหน่ง</p>
      <h4>2.1.1 หัวข้อย่อยระดับ 4 ลึกสุด (Nested H4 Detail 1)</h4>
      <p>ทดสอบระดับ H4 ที่ลึกที่สุด สารบัญจะเยื้องย่อยเข้ามาอีกระดับ</p>
      <h4>2.1.2 หัวข้อย่อยระดับ 4 อีกหัวข้อ (Nested H4 Detail 2)</h4>
      <p>สังเกตการเปลี่ยนสถานะ Active ของสารบัญเมื่อเลื่อนหน้าจอผ่าน</p>
      <h3>2.2 หัวข้อย่อยระดับ 3 ข้อที่สอง (Sub-section H3 Beta)</h3>
      <p>สลับกลับมาระดับ H3 ได้อย่างลื่นไหล</p>
      <h2>3. การจัดโครงสร้างรายการ (Ordered & Unordered Lists)</h2>
      <h3>3.1 รายการแบบมีลำดับตัวเลข (Numbered Steps)</h3>
      <ol>
        <li>ขั้นตอนแรก: เปิดดูแถบวัดการอ่านสีเขียวด้านบนสุด</li>
        <li>ขั้นตอนที่สอง: ทดลองคลิกปุ่ม <code>&lt;</code> ที่หัวสารบัญเพื่อพับเก็บเป็นปุ่มลอย <code>[目 สารบัญ]</code></li>
        <li>ขั้นตอนที่สาม: คลิกปุ่มลอยเพื่อกางสารบัญออกมาอีกครั้ง</li>
        <li>ขั้นตอนที่สี่: คลิกหัวข้อใดก็ได้ในสารบัญเพื่อทดสอบ Smooth Scrolling</li>
      </ol>
      <h3>3.2 รายการแบบสัญลักษณ์จุด (Bullet Points)</h3>
      <ul>
        <li>Astro 5 & Tailwind CSS: โหลดเร็วระดับมิลลิวินาที</li>
        <li>ScrollSpy ด้วย IntersectionObserver: นุ่มนวล ไม่กิน CPU</li>
        <li>Pure Floating Widget: ลอยอิสระ ไม่กินพื้นที่อ่าน</li>
      </ul>
      <h2>4. บล็อกคำพูดและข้อความอ้างอิง (Blockquotes & Quotes)</h2>
      <blockquote>
        "ความสงบและเรียบง่าย ไม่ได้หมายถึงความว่างเปล่า หากแต่คือการจัดวางทุกสิ่งให้อยู่ในที่ที่ถูกต้องและลงตัวที่สุด"
        <br /><br />
        — 栞 Shiori Editorial Philosophy
      </blockquote>
      <h2>5. โค้ดบล็อกโปรแกรมมิ่ง (Preformatted Code Blocks)</h2>
      <pre><code class="language-typescript">// TypeScript: ตัวอย่างการทำงานของ ScrollSpy Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      highlightTocLink(entry.target.id);
    }
  });
}, { rootMargin: "-100px 0px -60% 0px" });</code></pre>
      <h2>6. ตารางข้อมูลและการเปรียบเทียบ (Responsive Table)</h2>
      <table>
        <thead>
          <tr>
            <th>องค์ประกอบ</th>
            <th>ระดับแท็ก HTML</th>
            <th>การแสดงในสารบัญ (TOC)</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>หัวเรื่องบทความ</td>
            <td><code>&lt;h1&gt;</code></td>
            <td>ส่วนหัวหน้าเว็บ (Header)</td>
            <td>พร้อมใช้งาน</td>
          </tr>
          <tr>
            <td>หัวข้อหลัก</td>
            <td><code>&lt;h2&gt;</code></td>
            <td>หัวข้อหลักระดับ 1</td>
            <td>พร้อมใช้งาน</td>
          </tr>
          <tr>
            <td>ข้อย่อย</td>
            <td><code>&lt;h3&gt;</code></td>
            <td>เยื้องระดับที่ 2</td>
            <td>พร้อมใช้งาน</td>
          </tr>
          <tr>
            <td>ข้อย่อยลึก</td>
            <td><code>&lt;h4&gt;</code></td>
            <td>เยื้องระดับที่ 3</td>
            <td>พร้อมใช้งาน</td>
          </tr>
        </tbody>
      </table>
      <h2>7. สื่อและรูปภาพประกอบพร้อมคำบรรยาย (Figure & Figcaption)</h2>
      <figure>
        <img 
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80" 
          alt="มุมอ่านหนังสือยามบ่าย" 
          class="rounded-2xl shadow-md w-full" 
        />
        <figcaption class="text-center text-xs text-text-muted mt-2">
          ภาพตัวอย่าง: โต๊ะอ่านหนังสือกับแสงแดดยามบ่ายแสนอบอุ่น
        </figcaption>
      </figure>
      <h2>8. สรุปภาพรวมและปิดท้าย (Summary & Review)</h2>
      <p>ครบถ้วนทุกองค์ประกอบ! สารบัญลอยด้านซ้าย และหลอดสีเขียวด้านบนพร้อมให้คุณทดสอบแล้วครับ 🏮✨</p>
    `,
  };

  try {
    await db.insert(User).values({
      id: 'admin-seed-id-001',
      email: 'admin@example.com',
      password: '$2b$10$cok6lE9CuzE.p4A1oyb9V.EaajJOVGcUsiVrCcTUORsIhgqiki0C6',
      name: 'Admin Shiori',
      role: 'admin',
      image: '',
      createdAt: new Date(),
    });
  } catch (e) {
    // User already exists
  }

  await db.insert(Post).values([showcasePost, ...posts]);
}

