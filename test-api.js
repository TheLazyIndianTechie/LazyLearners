const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Test courses endpoint
    const response = await fetch('http://localhost:3001/api/courses');
    const data = await response.json();

    console.log('Total courses:', data.courses.length);

    if (data.courses.length > 0) {
      const course = data.courses[0];
      console.log('First course:', course.title);
      console.log('Instructor ID:', course.instructorId);

      // Test instructor-specific courses
      const instructorResponse = await fetch(`http://localhost:3001/api/courses?instructorId=${course.instructorId}`);
      const instructorData = await instructorResponse.json();
      console.log('Instructor courses:', instructorData.courses.length);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI();