import {
  sanitizeStrict,
  sanitizeBasic,
  sanitizeRichText,
  sanitizeCode,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeUsername,
  sanitizeSlug,
  escapeLikePattern,
  sanitizeOrderByField,
  sanitizeObject,
  validateFileExtension,
  validateMimeType,
  sanitizeFileMetadata,
  removeDangerousAttributes,
  stripHtml,
  sanitizeMarkdown,
  containsXssPatterns,
  sanitizeByType,
} from '@/lib/sanitize'

describe('Sanitization Utilities', () => {
  describe('sanitizeStrict', () => {
    it('should remove all HTML tags', () => {
      expect(sanitizeStrict('<script>alert("xss")</script>Hello')).toBe('Hello')
      expect(sanitizeStrict('<b>Bold</b> text')).toBe('Bold text')
    })

    it('should handle empty input', () => {
      expect(sanitizeStrict('')).toBe('')
    })

    it('should keep plain text unchanged', () => {
      expect(sanitizeStrict('Plain text')).toBe('Plain text')
    })
  })

  describe('sanitizeBasic', () => {
    it('should allow safe formatting tags', () => {
      const input = '<b>Bold</b> and <i>italic</i> text'
      const result = sanitizeBasic(input)
      expect(result).toContain('<b>Bold</b>')
      expect(result).toContain('<i>italic</i>')
    })

    it('should remove dangerous tags', () => {
      expect(sanitizeBasic('<script>alert("xss")</script>Hello')).not.toContain('script')
    })

    it('should remove event handlers', () => {
      expect(sanitizeBasic('<b onclick="alert()">Click</b>')).not.toContain('onclick')
    })
  })

  describe('sanitizeRichText', () => {
    it('should allow rich text elements', () => {
      const input = '<h1>Heading</h1><p>Paragraph</p><a href="/">Link</a>'
      const result = sanitizeRichText(input)
      expect(result).toContain('<h1>')
      expect(result).toContain('<p>')
      expect(result).toContain('<a')
    })

    it('should remove dangerous protocols in links', () => {
      const input = '<a href="javascript:alert()">Click</a>'
      const result = sanitizeRichText(input)
      expect(result).not.toContain('javascript:')
    })

    it('should allow https links', () => {
      const input = '<a href="https://example.com">Link</a>'
      const result = sanitizeRichText(input)
      expect(result).toContain('https://example.com')
    })
  })

  describe('sanitizeCode', () => {
    it('should preserve code blocks', () => {
      const input = '<pre><code class="language-js">const x = 1;</code></pre>'
      const result = sanitizeCode(input)
      expect(result).toContain('<code')
      expect(result).toContain('language-js')
    })

    it('should remove non-code tags', () => {
      const input = '<script>alert()</script><code>safe</code>'
      const result = sanitizeCode(input)
      expect(result).not.toContain('script')
      expect(result).toContain('<code>')
    })
  })

  describe('sanitizeUrl', () => {
    it('should allow valid HTTP URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('should allow relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page')
    })

    it('should block javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert()')).toBe('')
    })

    it('should block data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert()</script>')).toBe('')
    })

    it('should allow mailto: protocol', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com')
    })

    it('should allow tel: protocol', () => {
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890')
    })

    it('should trim whitespace', () => {
      expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com')
    })

    it('should handle empty input', () => {
      expect(sanitizeUrl('')).toBe('')
    })
  })

  describe('sanitizeEmail', () => {
    it('should validate and normalize valid emails', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com')
      expect(sanitizeEmail('  user@domain.org  ')).toBe('user@domain.org')
    })

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('not-an-email')).toBe('')
      expect(sanitizeEmail('@example.com')).toBe('')
      expect(sanitizeEmail('user@')).toBe('')
    })

    it('should handle empty input', () => {
      expect(sanitizeEmail('')).toBe('')
    })
  })

  describe('sanitizeFilename', () => {
    it('should sanitize special characters', () => {
      expect(sanitizeFilename('my file!@#.txt')).toBe('my_file___.txt')
    })

    it('should prevent directory traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('._._._etc_passwd')
    })

    it('should remove leading dots', () => {
      expect(sanitizeFilename('...hidden')).toBe('hidden')
    })

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt'
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255)
    })

    it('should allow valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf')
      expect(sanitizeFilename('my-file_2024.txt')).toBe('my-file_2024.txt')
    })
  })

  describe('sanitizeSearchQuery', () => {
    it('should remove HTML angle brackets', () => {
      expect(sanitizeSearchQuery('<script>search')).toBe('scriptsearch')
    })

    it('should trim whitespace', () => {
      expect(sanitizeSearchQuery('  query  ')).toBe('query')
    })

    it('should limit length to 200 characters', () => {
      const longQuery = 'a'.repeat(300)
      expect(sanitizeSearchQuery(longQuery).length).toBe(200)
    })
  })

  describe('sanitizeUsername', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeUsername('UserName')).toBe('username')
    })

    it('should allow alphanumeric, underscore, hyphen', () => {
      expect(sanitizeUsername('user_name-123')).toBe('user_name-123')
    })

    it('should remove special characters', () => {
      expect(sanitizeUsername('user@name!')).toBe('username')
    })

    it('should limit length to 30 characters', () => {
      const longUsername = 'a'.repeat(50)
      expect(sanitizeUsername(longUsername).length).toBe(30)
    })
  })

  describe('sanitizeSlug', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeSlug('My Blog Post')).toBe('my-blog-post')
    })

    it('should replace spaces with hyphens', () => {
      expect(sanitizeSlug('hello world test')).toBe('hello-world-test')
    })

    it('should remove special characters', () => {
      expect(sanitizeSlug('post@2024#test')).toBe('post2024test')
    })

    it('should remove leading/trailing hyphens', () => {
      expect(sanitizeSlug('-hello-world-')).toBe('hello-world')
    })

    it('should replace multiple hyphens with single', () => {
      expect(sanitizeSlug('hello---world')).toBe('hello-world')
    })

    it('should limit length to 200 characters', () => {
      const longSlug = 'a'.repeat(300)
      expect(sanitizeSlug(longSlug).length).toBeLessThanOrEqual(200)
    })
  })

  describe('escapeLikePattern', () => {
    it('should escape percent signs', () => {
      expect(escapeLikePattern('50%')).toBe('50\\%')
    })

    it('should escape underscores', () => {
      expect(escapeLikePattern('user_name')).toBe('user\\_name')
    })

    it('should escape backslashes', () => {
      expect(escapeLikePattern('path\\to\\file')).toBe('path\\\\to\\\\file')
    })

    it('should handle empty input', () => {
      expect(escapeLikePattern('')).toBe('')
    })
  })

  describe('sanitizeOrderByField', () => {
    const allowedFields = ['id', 'createdAt', 'title']

    it('should return field if in allowed list', () => {
      expect(sanitizeOrderByField('title', allowedFields)).toBe('title')
    })

    it('should return first allowed field if input not allowed', () => {
      expect(sanitizeOrderByField('malicious', allowedFields)).toBe('id')
    })

    it('should sanitize field name', () => {
      expect(sanitizeOrderByField('id; DROP TABLE', allowedFields)).toBe('id')
    })

    it('should handle empty input', () => {
      expect(sanitizeOrderByField('', allowedFields)).toBe('id')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const input = {
        name: '<b>John</b>',
        bio: '<script>alert()</script>Hello',
      }
      const result = sanitizeObject(input)
      expect(result.name).toContain('<b>')
      expect(result.bio).not.toContain('script')
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>John</b>',
        },
      }
      const result = sanitizeObject(input)
      expect(result.user.name).toContain('<b>')
    })

    it('should preserve non-string values', () => {
      const input = {
        count: 42,
        active: true,
        data: null,
      }
      const result = sanitizeObject(input)
      expect(result.count).toBe(42)
      expect(result.active).toBe(true)
      expect(result.data).toBe(null)
    })

    it('should handle arrays', () => {
      const input = ['<b>one</b>', '<script>two</script>']
      const result = sanitizeObject(input)
      expect(result[0]).toContain('<b>')
      expect(result[1]).not.toContain('script')
    })
  })

  describe('validateFileExtension', () => {
    const allowedExtensions = ['jpg', 'png', 'pdf']

    it('should validate allowed extensions', () => {
      expect(validateFileExtension('photo.jpg', allowedExtensions)).toBe(true)
      expect(validateFileExtension('document.PDF', allowedExtensions)).toBe(true)
    })

    it('should reject disallowed extensions', () => {
      expect(validateFileExtension('script.exe', allowedExtensions)).toBe(false)
    })

    it('should handle files without extension', () => {
      expect(validateFileExtension('filename', allowedExtensions)).toBe(false)
    })
  })

  describe('validateMimeType', () => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']

    it('should validate exact MIME types', () => {
      expect(validateMimeType('image/jpeg', allowedTypes)).toBe(true)
      expect(validateMimeType('application/pdf', allowedTypes)).toBe(true)
    })

    it('should reject disallowed MIME types', () => {
      expect(validateMimeType('application/exe', allowedTypes)).toBe(false)
    })

    it('should support wildcard matching', () => {
      const wildcardTypes = ['image/*', 'video/*']
      expect(validateMimeType('image/jpeg', wildcardTypes)).toBe(true)
      expect(validateMimeType('video/mp4', wildcardTypes)).toBe(true)
      expect(validateMimeType('application/pdf', wildcardTypes)).toBe(false)
    })
  })

  describe('sanitizeFileMetadata', () => {
    it('should validate correct metadata', () => {
      const metadata = {
        filename: 'document.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      }
      const result = sanitizeFileMetadata(metadata)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should sanitize filename', () => {
      const metadata = {
        filename: 'my file!.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      }
      const result = sanitizeFileMetadata(metadata)
      expect(result.filename).toBe('my_file_.pdf')
    })

    it('should reject invalid MIME type', () => {
      const metadata = {
        filename: 'file.pdf',
        mimeType: 'invalid',
        size: 1024,
      }
      const result = sanitizeFileMetadata(metadata)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid MIME type')
    })

    it('should reject file size over limit', () => {
      const metadata = {
        filename: 'file.pdf',
        mimeType: 'application/pdf',
        size: 200 * 1024 * 1024, // 200MB
      }
      const result = sanitizeFileMetadata(metadata)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid file size')
    })

    it('should reject zero or negative size', () => {
      const metadata = {
        filename: 'file.pdf',
        mimeType: 'application/pdf',
        size: 0,
      }
      const result = sanitizeFileMetadata(metadata)
      expect(result.isValid).toBe(false)
    })
  })

  describe('removeDangerousAttributes', () => {
    it('should remove onclick handlers', () => {
      const input = '<div onclick="alert()">Click</div>'
      expect(removeDangerousAttributes(input)).not.toContain('onclick')
    })

    it('should remove multiple dangerous attributes', () => {
      const input = '<img onload="alert()" onerror="alert()" src="x">'
      const result = removeDangerousAttributes(input)
      expect(result).not.toContain('onload')
      expect(result).not.toContain('onerror')
    })
  })

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtml('<b>Bold</b> text')).toBe('Bold text')
      expect(stripHtml('<div><p>Nested</p></div>')).toBe('Nested')
    })

    it('should handle empty input', () => {
      expect(stripHtml('')).toBe('')
    })
  })

  describe('sanitizeMarkdown', () => {
    it('should strip HTML from markdown', () => {
      const input = '# Heading\n<script>alert()</script>\n**Bold**'
      const result = sanitizeMarkdown(input)
      expect(result).not.toContain('script')
      expect(result).toContain('# Heading')
      expect(result).toContain('**Bold**')
    })
  })

  describe('containsXssPatterns', () => {
    it('should detect script tags', () => {
      expect(containsXssPatterns('<script>alert()</script>')).toBe(true)
    })

    it('should detect javascript: protocol', () => {
      expect(containsXssPatterns('javascript:alert()')).toBe(true)
    })

    it('should detect event handlers', () => {
      expect(containsXssPatterns('<div onclick="alert()">Click</div>')).toBe(true)
    })

    it('should detect iframe tags', () => {
      expect(containsXssPatterns('<iframe src="evil.com"></iframe>')).toBe(true)
    })

    it('should return false for safe content', () => {
      expect(containsXssPatterns('This is safe text')).toBe(false)
    })

    it('should handle empty input', () => {
      expect(containsXssPatterns('')).toBe(false)
    })
  })

  describe('sanitizeByType', () => {
    const dangerousInput = '<script>alert()</script><b>Hello</b>'

    it('should use strict sanitization', () => {
      expect(sanitizeByType(dangerousInput, 'strict')).not.toContain('<b>')
    })

    it('should use basic sanitization', () => {
      const result = sanitizeByType(dangerousInput, 'basic')
      expect(result).toContain('<b>')
      expect(result).not.toContain('script')
    })

    it('should use richtext sanitization', () => {
      const richInput = '<h1>Title</h1><p>Text</p>'
      const result = sanitizeByType(richInput, 'richtext')
      expect(result).toContain('<h1>')
      expect(result).toContain('<p>')
    })

    it('should use code sanitization', () => {
      const codeInput = '<code>const x = 1;</code>'
      const result = sanitizeByType(codeInput, 'code')
      expect(result).toContain('<code>')
    })

    it('should use markdown sanitization', () => {
      const mdInput = '# Title\n<script>alert()</script>'
      const result = sanitizeByType(mdInput, 'markdown')
      expect(result).not.toContain('script')
    })

    it('should default to basic sanitization', () => {
      // @ts-ignore - testing default case
      const result = sanitizeByType(dangerousInput, 'unknown')
      expect(result).toContain('<b>')
      expect(result).not.toContain('script')
    })
  })
})
