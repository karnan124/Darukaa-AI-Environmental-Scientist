import type { EnvironmentalContext, ChatMessage } from '../src/types/environmental.js';
import { EMPTY_ENVIRONMENTAL_CONTEXT } from '../src/types/environmental.js';

export interface SessionState {
  sessionId: string;
  context: EnvironmentalContext;
  messages: ChatMessage[];
  lastActive: number;
}

export class ConversationMemoryManager {
  private sessions: Map<string, SessionState> = new Map();

  public getOrCreateSession(sessionId = 'default'): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        context: JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT)),
        messages: [],
        lastActive: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActive = Date.now();
    }
    return session;
  }

  public updateContext(sessionId: string, newVariables: Partial<EnvironmentalContext>): EnvironmentalContext {
    const session = this.getOrCreateSession(sessionId);

    // Deep merge non-null / non-undefined fields
    if (newVariables.location) {
      if (newVariables.location.region !== undefined && newVariables.location.region !== null) {
        session.context.location.region = newVariables.location.region;
      }
      if (newVariables.location.latitude !== undefined && newVariables.location.latitude !== null) {
        session.context.location.latitude = newVariables.location.latitude;
      }
      if (newVariables.location.longitude !== undefined && newVariables.location.longitude !== null) {
        session.context.location.longitude = newVariables.location.longitude;
      }
    }

    if (newVariables.soil) {
      if (newVariables.soil.ph !== undefined && newVariables.soil.ph !== null) {
        session.context.soil.ph = newVariables.soil.ph;
      }
      if (newVariables.soil.organic_carbon_percent !== undefined && newVariables.soil.organic_carbon_percent !== null) {
        session.context.soil.organic_carbon_percent = newVariables.soil.organic_carbon_percent;
      }
      if (newVariables.soil.moisture_percent !== undefined && newVariables.soil.moisture_percent !== null) {
        session.context.soil.moisture_percent = newVariables.soil.moisture_percent;
      }
    }

    if (newVariables.land) {
      if (newVariables.land.land_use !== undefined && newVariables.land.land_use !== null) {
        session.context.land.land_use = newVariables.land.land_use;
      }
      if (newVariables.land.crop !== undefined && newVariables.land.crop !== null) {
        session.context.land.crop = newVariables.land.crop;
      }
      if (newVariables.land.cropping_system !== undefined && newVariables.land.cropping_system !== null) {
        session.context.land.cropping_system = newVariables.land.cropping_system;
      }
      if (newVariables.land.habitat_fragmentation !== undefined && newVariables.land.habitat_fragmentation !== null) {
        session.context.land.habitat_fragmentation = newVariables.land.habitat_fragmentation;
      }
    }

    if (newVariables.biodiversity) {
      if (newVariables.biodiversity.species_richness !== undefined && newVariables.biodiversity.species_richness !== null) {
        session.context.biodiversity.species_richness = newVariables.biodiversity.species_richness;
      }
      if (newVariables.biodiversity.habitat_diversity !== undefined && newVariables.biodiversity.habitat_diversity !== null) {
        session.context.biodiversity.habitat_diversity = newVariables.biodiversity.habitat_diversity;
      }
      if (newVariables.biodiversity.pollinator_diversity !== undefined && newVariables.biodiversity.pollinator_diversity !== null) {
        session.context.biodiversity.pollinator_diversity = newVariables.biodiversity.pollinator_diversity;
      }
    }

    if (newVariables.climate) {
      if (newVariables.climate.temperature_c !== undefined && newVariables.climate.temperature_c !== null) {
        session.context.climate.temperature_c = newVariables.climate.temperature_c;
      }
      if (newVariables.climate.rainfall_mm !== undefined && newVariables.climate.rainfall_mm !== null) {
        session.context.climate.rainfall_mm = newVariables.climate.rainfall_mm;
      }
      if (newVariables.climate.rainfall_pattern !== undefined && newVariables.climate.rainfall_pattern !== null) {
        session.context.climate.rainfall_pattern = newVariables.climate.rainfall_pattern;
      }
      if (newVariables.climate.water_availability !== undefined && newVariables.climate.water_availability !== null) {
        session.context.climate.water_availability = newVariables.climate.water_availability;
      }
    }

    if (newVariables.human_impact) {
      if (newVariables.human_impact.pollution_level !== undefined && newVariables.human_impact.pollution_level !== null) {
        session.context.human_impact.pollution_level = newVariables.human_impact.pollution_level;
      }
      if (newVariables.human_impact.deforestation_pressure !== undefined && newVariables.human_impact.deforestation_pressure !== null) {
        session.context.human_impact.deforestation_pressure = newVariables.human_impact.deforestation_pressure;
      }
    }

    return session.context;
  }

  public setFullContext(sessionId: string, fullContext: EnvironmentalContext): EnvironmentalContext {
    const session = this.getOrCreateSession(sessionId);
    session.context = JSON.parse(JSON.stringify(fullContext));
    return session.context;
  }

  public addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push(message);
  }

  public getMessages(sessionId: string): ChatMessage[] {
    return this.getOrCreateSession(sessionId).messages;
  }

  public getContext(sessionId: string): EnvironmentalContext {
    return this.getOrCreateSession(sessionId).context;
  }

  public resetSession(sessionId = 'default'): void {
    this.sessions.delete(sessionId);
  }
}

export const conversationMemoryManager = new ConversationMemoryManager();
