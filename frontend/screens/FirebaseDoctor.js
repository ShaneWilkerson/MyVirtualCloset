import React, { useState } from 'react';
import { View, Text, Button, TextInput, ScrollView } from 'react-native';
import { auth } from '../services/auth';
import { db } from '../services/db';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

export default function FirebaseDoctor() {
  const [out, setOut] = useState('');
  const [probeEmail, setProbeEmail] = useState('');

  const log = (o) => setOut((p) => p + (typeof o === 'string' ? o : JSON.stringify(o, null, 2)) + '\n');

  const checkConfig = () => {
    const opts = auth.app.options || {};
    log({
      projectId: opts.projectId,
      apiKeyMasked: (opts.apiKey || '').slice(0, 6) + '…',
      authDomain: opts.authDomain,
      storageBucket: opts.storageBucket,
    });
  };

  const probeFirestore = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), limit(1)));
      log({ firestoreOK: true, count: snap.size });
    } catch (e) {
      log({ firestoreOK: false, code: e.code, message: e.message });
    }
  };

  const probeAuthEmail = async () => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, probeEmail.trim());
      log({ authOK: true, email: probeEmail.trim(), methods });
    } catch (e) {
      log({ authOK: false, code: e.code, message: e.message });
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Firebase Doctor</Text>

      <Button title="Check config" onPress={checkConfig} />
      <View style={{ height: 8 }} />
      <Button title="Probe Firestore (users/ any 1)" onPress={probeFirestore} />
      <View style={{ height: 8 }} />
      <TextInput
        placeholder="probe email (existing or not)"
        autoCapitalize="none"
        autoCorrect={false}
        value={probeEmail}
        onChangeText={setProbeEmail}
        style={{ borderWidth: 1, padding: 8, borderRadius: 6, marginBottom: 8 }}
      />
      <Button title="Probe Auth (fetch sign-in methods)" onPress={probeAuthEmail} />

      <View style={{ height: 16 }} />
      <Text selectable style={{ fontFamily: 'monospace' }}>{out}</Text>
    </ScrollView>
  );
}
