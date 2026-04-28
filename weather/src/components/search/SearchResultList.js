import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/colors';

const SearchResultItem = ({ item, onPress }) => {
  const { name, country, state, lat, lon } = item;

  return (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => onPress(item)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.cityName}>{name}</Text>
        <Text style={styles.locationDetails}>
          {[state, country].filter(Boolean).join(', ')}
        </Text>
      </View>
      <View style={styles.coordinates}>
        <Text style={styles.coordText}>
          {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const SearchResultList = ({ 
  results, 
  onSelectCity, 
  loading, 
  error,
  history,
  onSelectHistory,
  showHistory = true
}) => {
  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => onSelectHistory && onSelectHistory(item)}
    >
      <Text style={styles.historyCityName}>{item.name}</Text>
      <Text style={styles.historyCountry}>{item.country}</Text>
    </TouchableOpacity>
  );

  const renderResultItem = ({ item }) => (
    <SearchResultItem item={item} onPress={onSelectCity} />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Searching...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (results.length === 0 && (!history || history.length === 0)) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noResultsText}>No cities found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHistory && history && history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `history-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item, index) => `result-${index}`}
            contentContainerStyle={styles.resultsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  historySection: {
    marginBottom: 20,
  },
  resultsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  historyList: {
    paddingHorizontal: 15,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  historyCityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 5,
  },
  historyCountry: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContent: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 5,
  },
  locationDetails: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  coordinates: {
    marginLeft: 15,
  },
  coordText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default SearchResultList;
