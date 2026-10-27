import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import apiClient, { updateApiBaseUrl } from '../api/apiClient';
import { colors } from '../theme/colors';

export default function ConfigServerModal({ visible, onClose }) {
    const [url, setUrl] = useState(apiClient.defaults.baseURL || '');

    const handleSave = async () => {
        try {
            const updated = await updateApiBaseUrl(url);
            Alert.alert('Thành công', `Đã cập nhật máy chủ API:\n${updated}`);
            onClose();
        } catch (e) {
            Alert.alert('Lỗi', e.message);
        }
    };

    const setPreset = (presetUrl) => {
        setUrl(presetUrl);
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>⚙️ Cấu hình Máy Chủ API</Text>
                    <Text style={styles.subtitle}>
                        Chọn hoặc nhập địa chỉ IP máy chủ XAMPP đang chạy
                    </Text>

                    <Text style={styles.label}>Base URL Hiện tại:</Text>
                    <TextInput
                        style={styles.input}
                        value={url}
                        onChangeText={setUrl}
                        autoCapitalize="none"
                        placeholder="http://192.168.1.87/apiAppdatvexekhach"
                    />

                    <View style={styles.presets}>
                        <TouchableOpacity
                            style={styles.presetBadge}
                            onPress={() => setPreset('http://192.168.1.87/apiAppdatvexekhach')}
                        >
                            <Text style={styles.presetText}>WiFi (192.168.1.87)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetBadge}
                            onPress={() => setPreset('http://10.0.2.2/apiAppdatvexekhach')}
                        >
                            <Text style={styles.presetText}>Android Emulator (10.0.2.2)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.presetBadge}
                            onPress={() => setPreset('http://localhost/apiAppdatvexekhach')}
                        >
                            <Text style={styles.presetText}>Localhost / Web</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>Đóng</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                            <Text style={styles.saveText}>Lưu Cấu Hình</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text
    },
    subtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 16
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 10,
        fontSize: 14
    },
    presets: {
        marginTop: 12,
        gap: 6
    },
    presetBadge: {
        backgroundColor: colors.primarySoft,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center'
    },
    presetText: {
        fontSize: 12,
        color: colors.primaryDark,
        fontWeight: '500'
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 20
    },
    cancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.border
    },
    cancelText: {
        color: colors.textMuted,
        fontWeight: '600'
    },
    saveBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: colors.primary
    },
    saveText: {
        color: colors.white,
        fontWeight: 'bold'
    }
});
