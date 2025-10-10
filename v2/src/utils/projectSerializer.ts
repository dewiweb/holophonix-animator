import { Project } from '@/types'

/**
 * Serialize a project to JSON string for file storage
 */
export function serializeProject(project: Project): string {
  try {
    // Convert dates to ISO strings for JSON serialization
    const serializable = {
      ...project,
      metadata: {
        ...project.metadata,
        created: project.metadata.created instanceof Date 
          ? project.metadata.created.toISOString() 
          : project.metadata.created,
        modified: project.metadata.modified instanceof Date 
          ? project.metadata.modified.toISOString() 
          : project.metadata.modified,
      },
    }
    
    return JSON.stringify(serializable, null, 2)
  } catch (error) {
    console.error('❌ Error serializing project:', error)
    throw new Error('Failed to serialize project')
  }
}

/**
 * Deserialize a project from JSON string
 */
export function deserializeProject(jsonString: string): Project {
  try {
    const data = JSON.parse(jsonString)
    
    // Convert ISO strings back to Date objects
    const project: Project = {
      ...data,
      metadata: {
        ...data.metadata,
        created: new Date(data.metadata.created),
        modified: new Date(data.metadata.modified),
      },
    }
    
    return project
  } catch (error) {
    console.error('❌ Error deserializing project:', error)
    throw new Error('Failed to deserialize project')
  }
}

/**
 * Validate project structure
 */
export function validateProject(project: any): project is Project {
  return (
    project &&
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    Array.isArray(project.tracks) &&
    Array.isArray(project.animations) &&
    project.coordinateSystem &&
    project.metadata &&
    project.metadata.version
  )
}
