/**
 * AdminContainer - Unified container component for all admin tabs
 * 
 * Provides consistent styling across all admin sections:
 * - Grayscale/black theme with subtle green accents
 * - JetBrains Mono font at 13px
 * - No icons, minimal borders
 * - Consistent padding, spacing, border-radius
 */
export default function AdminContainer({ 
  title, 
  description, 
  children,
  actions = null,
  className = ""
}) {
  return (
    <div className={`admin-container ${className}`}>
      {/* Header */}
      {(title || description || actions) && (
        <div className="admin-header">
          <div className="admin-header-content">
            {title && <h2 className="admin-title">{title}</h2>}
            {description && <p className="admin-description">{description}</p>}
          </div>
          {actions && <div className="admin-actions">{actions}</div>}
        </div>
      )}
      
      {/* Content */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}

/**
 * AdminSection - Subsection within an AdminContainer
 */
export function AdminSection({ title, children, className = "" }) {
  return (
    <div className={`admin-section ${className}`}>
      {title && <h3 className="admin-section-title">{title}</h3>}
      <div className="admin-section-content">
        {children}
      </div>
    </div>
  );
}

/**
 * AdminCard - Card component for displaying grouped information
 */
export function AdminCard({ title, children, className = "", hover = false }) {
  return (
    <div className={`admin-card ${hover ? 'admin-card-hover' : ''} ${className}`}>
      {title && <div className="admin-card-title">{title}</div>}
      <div className="admin-card-content">
        {children}
      </div>
    </div>
  );
}

/**
 * AdminButton - Consistent button styling
 */
export function AdminButton({ 
  children, 
  onClick, 
  variant = 'default', // default, primary, danger
  disabled = false,
  className = ""
}) {
  const variantClasses = {
    default: 'admin-btn-default',
    primary: 'admin-btn-primary',
    danger: 'admin-btn-danger',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`admin-btn ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * AdminInput - Consistent input styling
 */
export function AdminInput({ 
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`admin-input ${className}`}
    />
  );
}

/**
 * AdminSelect - Consistent select/dropdown styling
 */
export function AdminSelect({ 
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  disabled = false
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`admin-select ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * AdminBadge - Status badge component
 */
export function AdminBadge({ 
  status, // certified, warning, reject, info
  children,
  className = ""
}) {
  const statusClasses = {
    certified: 'admin-badge-certified',
    warning: 'admin-badge-warning',
    reject: 'admin-badge-reject',
    info: 'admin-badge-info',
  };

  return (
    <span className={`admin-badge ${statusClasses[status] || 'admin-badge-info'} ${className}`}>
      {children}
    </span>
  );
}

/**
 * AdminMetric - Display a metric with label and value
 */
export function AdminMetric({ label, value, unit = '', className = "" }) {
  return (
    <div className={`admin-metric ${className}`}>
      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-value">
        {value}{unit && <span className="admin-metric-unit">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * AdminCodeBlock - Display code or pre-formatted text
 */
export function AdminCodeBlock({ children, className = "" }) {
  return (
    <pre className={`admin-code ${className}`}>
      <code>{children}</code>
    </pre>
  );
}
