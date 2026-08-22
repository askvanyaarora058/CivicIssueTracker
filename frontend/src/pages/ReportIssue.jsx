import { supabase } from '../lib/supabase.js'
import MapPicker from '../components/MapPicker.jsx'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createIssue, ApiError } from '../services/api.js'
import { useToast } from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { CATEGORY_OPTIONS } from '../components/IssueFilters.jsx'

const CATEGORIES = CATEGORY_OPTIONS.filter((c) => c.value !== 'All')

export default function ReportIssue() {
  const navigate = useNavigate()
  const toast = useToast()
  const { handleSessionExpired } = useAuth()
  const [form, setForm] = useState({
  title: '',
  description: '',
  category: CATEGORIES[0].value,
  address: '',
  photo_url: '',
  photo_file: null,
  latitude: '',
  longitude: '',
})
  

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  function validate() {
    const next = {}

    if (!form.title.trim()) {
      next.title = 'Title is required.'
    }

    if (!form.description.trim()) {
      next.description = 'Description is required.'
    }

    if (!form.category) {
      next.category = 'Choose a category.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Location is not supported by this browser.')
      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }))

        setLocating(false)
        toast.info('Location captured.')
      },
      () => {
        setLocating(false)
        toast.error(
          'Could not get your location. You can enter the address manually.'
        )
      }
    )
  }
  async function uploadImage() {
  if (!form.photo_file) return null

  const file = form.photo_file

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

  const { error } = await supabase.storage
    .from('issue-images')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`)
  }

  const { data } = supabase.storage
    .from('issue-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    if (!validate()) return

    setLoading(true)

    try {
      const photoUrl = await uploadImage()
      await createIssue({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        photo_url: photoUrl,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        address: form.address.trim() || null,
      })

      toast.success('Issue reported. Thanks for helping your community.')
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleSessionExpired()
        toast.error('Your session expired. Please log in again.')
        navigate('/login')
      } else if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        console.error('SUBMIT ERROR:', err)
  setSubmitError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section">
      <div className="section-inner" style={{ maxWidth: 640 }}>
        <h2>Report an issue</h2>

        <p style={{ color: 'var(--ink-soft)', marginBottom: 28 }}>
          Give as much detail as you can — it helps administrators act faster.
        </p>

        <div className="surface" style={{ padding: 28 }}>
          {submitError && (
            <div className="field-error" style={{ marginBottom: 16 }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Title */}
            <div className="field">
              <label htmlFor="title">Title</label>

              <input
                id="title"
                type="text"
                placeholder="e.g. Large pothole on Main Street"
                value={form.title}
                className={errors.title ? 'invalid' : ''}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />

              {errors.title && (
                <div className="field-error">{errors.title}</div>
              )}
            </div>

            {/* Description */}
            <div className="field">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                placeholder="Describe the issue, how long it's been there, and any safety concerns."
                value={form.description}
                className={errors.description ? 'invalid' : ''}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              {errors.description && (
                <div className="field-error">
                  {errors.description}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="field">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {errors.category && (
                <div className="field-error">
                  {errors.category}
                </div>
              )}
            </div>

            {/* Address */}
            <div className="field">
              <label htmlFor="address">
                Address (optional)
              </label>

              <input
                id="address"
                type="text"
                placeholder="Street, landmark, or intersection"
                value={form.address}
                onChange={(e) =>
                  setForm({ ...form, address: e.target.value })
                }
              />
            </div>

            {/* Photo */}
            <div className="field">
  <label htmlFor="photo">Photo (optional)</label>

  <input
    id="photo"
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0]

      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file.')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5 MB.')
        return
      }

      setForm((f) => ({
        ...f,
        photo_file: file,
      }))
    }}
  />

  {form.photo_file && (
    <p style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
      Selected: {form.photo_file.name}
    </p>
  )}
</div>

            {/* Location */}
            <div className="field">
  <label>Location (optional)</label>

  <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: 10 }}>
    Click on the map to select the issue location.
  </p>

  <MapPicker
    latitude={form.latitude}
    longitude={form.longitude}
    onLocationChange={({ latitude, longitude }) =>
      setForm((f) => ({
        ...f,
        latitude: String(latitude),
        longitude: String(longitude),
      }))
    }
  />

  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
    <input
      type="text"
      placeholder="Latitude"
      value={form.latitude}
      onChange={(e) => setForm({ ...form, latitude: e.target.value })}
    />

    <input
      type="text"
      placeholder="Longitude"
      value={form.longitude}
      onChange={(e) => setForm({ ...form, longitude: e.target.value })}
    />
  </div>

  <button
    type="button"
    className="btn btn-secondary btn-sm"
    style={{ marginTop: 8 }}
    onClick={useMyLocation}
    disabled={locating}
  >
    {locating ? 'Locating…' : 'Use my current location'}
  </button>
</div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                'Submit report'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}